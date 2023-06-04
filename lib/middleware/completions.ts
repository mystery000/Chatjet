import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { track } from '@/lib/posthog';
import { Database } from '@/types/supabase';
import { ApiError, Project } from '@/types/types';

import {
  checkWhitelistedDomainIfProjectKey,
  getProjectIdFromKey,
  getProjectIdFromToken,
  noProjectForTokenResponse,
  noTokenOrProjectKeyResponse,
} from './common';
import { checkCompletionsRateLimits } from '../rate-limits';
import { getAuthorizationToken, truncateMiddle } from '../utils';
import { removeSchema } from '../utils.edge';

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

export default async function CompletionsMiddleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    // Check that IP is present and not rate limited
    if (!req.ip) {
      return new Response('Forbidden', { status: 403 });
    }

    const rateLimitIPResult = await checkCompletionsRateLimits({
      value: req.ip,
      type: 'ip',
    });

    if (!rateLimitIPResult.result.success) {
      console.error(
        `[COMPLETIONS] [RATE-LIMIT] IP ${req.ip}, origin: ${req.headers.get(
          'origin',
        )}`,
      );
      return new Response('Too many requests', { status: 429 });
    }
  }

  const requesterOrigin = req.headers.get('origin');
  const requesterHost = requesterOrigin && removeSchema(requesterOrigin);

  if (requesterHost) {
    // Browser requests. Check that origin is not rate-limited.
    const rateLimitHostnameResult = await checkCompletionsRateLimits({
      value: requesterHost,
      type: 'hostname',
    });

    if (!rateLimitHostnameResult.result.success) {
      console.error(
        `[COMPLETIONS] [RATE-LIMIT] IP: ${req.ip}, origin: ${requesterOrigin}`,
      );
      return new Response('Too many requests', { status: 429 });
    }
  }

  const body = await req.json();

  const token = getAuthorizationToken(req.headers.get('Authorization'));
  // In v0, we support projectKey query parameters
  const projectKey =
    body.projectKey || req.nextUrl.searchParams.get('projectKey');

  if (!token && !projectKey) {
    return noTokenOrProjectKeyResponse;
  }

  let projectId: Project['id'] | undefined = undefined;

  if (token) {
    // If authorization token is present, use this to find the project id
    const rateLimitResult = await checkCompletionsRateLimits({
      value: token,
      type: 'token',
    });

    if (!rateLimitResult.result.success) {
      console.error(
        `[COMPLETIONS] [RATE-LIMIT] IP: ${req.ip}, token: ${truncateMiddle(
          token,
          2,
          2,
        )}`,
      );
      return new Response('Too many requests', { status: 429 });
    }

    const res = NextResponse.next();
    projectId = await getProjectIdFromToken(req, res, supabaseAdmin, token);

    if (!projectId) {
      return noProjectForTokenResponse;
    }
  }

  if (projectKey) {
    try {
      projectId = await getProjectIdFromKey(supabaseAdmin, projectKey);
      // Now that we have a project id, we need to check that the
      // the project has whitelisted the domain the request comes from.
      // Admin supabase needed here, as the projects table is subject to RLS.
      // We bypass this check if the key is a test key or if the request
      // comes from the app host (e.g. markprompt.com/s/[key]]).
      await checkWhitelistedDomainIfProjectKey(
        supabaseAdmin,
        projectKey,
        projectId,
        requesterHost,
      );
    } catch (e) {
      const apiError = e as ApiError;
      return new Response(apiError.message, { status: apiError.code });
    }
  }

  if (!projectId) {
    return new Response(
      'No project found matching the provided key or authorization token.',
      { status: 401 },
    );
  }

  return NextResponse.rewrite(
    new URL(`/api/v1/openai/completions/${projectId}`, req.url),
  );
}
