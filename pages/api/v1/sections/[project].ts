import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

import { getRequesterIp } from '@/lib/middleware/common';
import { track } from '@/lib/posthog';
import { checkSectionsRateLimits } from '@/lib/rate-limits';
import { FileSection, getMatchingSections } from '@/lib/sections';
import { getBYOOpenAIKey, getTeamStripeInfo } from '@/lib/supabase';
import { isRequestFromMarkprompt } from '@/lib/utils.edge';
import { Database } from '@/types/supabase';
import { ApiError, Project } from '@/types/types';

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

type Data =
  | {
      status?: string;
      error?: string;
    }
  | { data: Omit<FileSection, 'token_count'>[] };

const allowedMethods = ['GET'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  // Preflight check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const params = req.body;
  const prompt = params.prompt as string;
  const pathname = req.url || '';
  const projectId = req.query.project as Project['id'];

  const _isRequestFromMarkprompt = isRequestFromMarkprompt(req.headers.origin);

  if (!projectId) {
    console.error(`[SECTIONS] [${pathname}] No project found`);
    return res.status(400).json({ error: 'No project found' });
  }

  if (!prompt) {
    console.error(`[SECTIONS] [${projectId}] No prompt provided`);
    return res.status(400).json({ error: 'No prompt provided' });
  }

  // Apply rate limits, in additional to middleware rate limits.
  const rateLimitResult = await checkSectionsRateLimits({
    value: projectId,
    type: 'projectId',
  });

  const ip = getRequesterIp(req);

  if (!rateLimitResult.result.success) {
    console.error(`[SECTIONS] [RATE-LIMIT] [${projectId}] IP: ${ip}`);
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!_isRequestFromMarkprompt) {
    // Section queries are part of the Enterprise plans when used outside of
    // the Markprompt dashboard.
    const teamStripeInfo = await getTeamStripeInfo(supabaseAdmin, projectId);
    if (!teamStripeInfo?.isEnterprisePlan) {
      return res.status(401).json({
        error: `The sections endpoint is only accessible on the Enterprise plan. Please contact ${process.env.NEXT_PUBLIC_SALES_EMAIL} to get set up.`,
      });
    }
  }

  const byoOpenAIKey = await getBYOOpenAIKey(supabaseAdmin, projectId);

  const sanitizedQuery = prompt.trim().replaceAll('\n', ' ');

  let fileSections: FileSection[] = [];
  try {
    const sectionsResponse = await getMatchingSections(
      sanitizedQuery,
      prompt,
      params.sectionsMatchThreshold,
      params.sectionsMatchCount,
      projectId,
      byoOpenAIKey,
      'completions',
      supabaseAdmin,
    );
    fileSections = sectionsResponse.fileSections;
  } catch (e) {
    if (e instanceof ApiError) {
      return res.status(e.code).json({
        error: e.message,
      });
    } else {
      return res.status(400).json({
        error: `${e}`,
      });
    }
  }

  track(projectId, 'get sections', { projectId });

  return res.status(200).json({
    data: fileSections.map((section) => {
      return {
        path: section.path,
        content: section.content,
        similarity: section.similarity,
      };
    }),
  });
}
