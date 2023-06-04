import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

import { generateFileEmbeddings } from '@/lib/generate-embeddings';
import {
  checkEmbeddingsRateLimits,
  getEmbeddingsRateLimitResponse,
} from '@/lib/rate-limits';
import { getProjectConfigData, getProjectIdFromSource } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import {
  API_ERROR_ID_CONTENT_TOKEN_QUOTA_EXCEEDED,
  FileData,
  Source,
} from '@/types/types';

type Data = {
  status?: string;
  name?: string;
  error?: string;
  errors?: { path: string; message: string }[];
};

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

const allowedMethods = ['POST'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Admin Supabase does not have session data.
  const supabase = createServerSupabaseClient<Database>({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const file = req.body.file as FileData;
  const sourceId = req.body.sourceId as Source['id'];
  const projectId = await getProjectIdFromSource(supabaseAdmin, sourceId);

  if (!projectId) {
    return res.status(401).json({ error: 'Project not found.' });
  }

  // Apply rate limits
  const rateLimitResult = await checkEmbeddingsRateLimits({
    type: 'projectId',
    value: projectId,
  });

  res.setHeader('X-RateLimit-Limit', rateLimitResult.result.limit);
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.result.remaining);

  if (!rateLimitResult.result.success) {
    console.error(`[TRAIN] [RATE-LIMIT] Project: ${projectId}`);
    return res.status(429).json({
      status: getEmbeddingsRateLimitResponse(
        rateLimitResult.hours,
        rateLimitResult.minutes,
      ),
    });
  }

  const { byoOpenAIKey, markpromptConfig } = await getProjectConfigData(
    supabaseAdmin,
    projectId,
  );

  const errors = await generateFileEmbeddings(
    supabaseAdmin,
    projectId,
    sourceId,
    file,
    byoOpenAIKey,
    markpromptConfig,
  );

  if (errors) {
    console.error('Errors in trainfile', JSON.stringify(errors, null, 2));
  }

  const quotaExceededError = errors.find(
    (e) => e.id === API_ERROR_ID_CONTENT_TOKEN_QUOTA_EXCEEDED,
  );

  if (quotaExceededError) {
    // In case of a quota exceeded error, return an actual error code.
    return res.status(403).json({
      name: API_ERROR_ID_CONTENT_TOKEN_QUOTA_EXCEEDED,
      error: quotaExceededError.message,
    });
  }

  return res.status(200).json({ status: 'ok', errors });
}
