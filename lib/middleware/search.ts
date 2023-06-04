import { NextRequest, NextResponse } from 'next/server';

import { noTokenOrProjectKeyResponse } from './common';
import {
  checkCompletionsRateLimits,
  checkSearchRateLimits,
} from '../rate-limits';
import { getAuthorizationToken, truncateMiddle } from '../utils';
import { removeSchema } from '../utils.edge';

export default async function SearchMiddleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    // Check that IP is present and not rate limited
    if (!req.ip) {
      return new Response('Forbidden', { status: 403 });
    }

    const rateLimitIPResult = await checkSearchRateLimits({
      value: req.ip,
      type: 'ip',
    });

    if (!rateLimitIPResult.result.success) {
      console.error(
        `[SEARCH] [RATE-LIMIT] IP ${req.ip}, origin: ${req.headers.get(
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
        `[SEARCH] [RATE-LIMIT] IP: ${req.ip}, origin: ${requesterOrigin}`,
      );
      return new Response('Too many requests', { status: 429 });
    }
  }

  const token = getAuthorizationToken(req.headers.get('Authorization'));
  const projectKey = req.nextUrl.searchParams.get('projectKey');

  // let projectId: Project['id'] | undefined = undefined;

  let url: URL | undefined = undefined;
  if (token) {
    const rateLimitResult = await checkSearchRateLimits({
      value: token,
      type: 'token',
    });

    if (!rateLimitResult.result.success) {
      console.error(
        `[SEARCH] [RATE-LIMIT] IP: ${req.ip}, token: ${truncateMiddle(
          token,
          2,
          2,
        )}`,
      );
      return new Response('Too many requests', { status: 429 });
    }

    url = new URL(
      `/api/v1/search${req.nextUrl.search}&token=${token}`,
      req.url,
    );
  }

  if (projectKey) {
    const rateLimitResult = await checkSearchRateLimits({
      value: projectKey,
      type: 'projectKey',
    });

    if (!rateLimitResult.result.success) {
      console.error(
        `[SEARCH] [RATE-LIMIT] IP: ${req.ip}, projectKey: ${truncateMiddle(
          projectKey,
          2,
          2,
        )}`,
      );
      return new Response('Too many requests', { status: 429 });
    }

    // Don't pass projectKey here, as it's already in the query params
    url = new URL(
      `/api/v1/search${req.nextUrl.search}&host=${requesterHost}`,
      req.url,
    );
    // try {
    //   projectId = await getProjectIdFromKey(supabaseAdmin, projectKey);
    //   // Now that we have a project id, we need to check that the
    //   // the project has whitelisted the domain the request comes from.
    //   // Admin supabase needed here, as the projects table is subject to RLS.
    //   // We bypass this check if the key is a test key or if the request
    //   // comes from the app host (e.g. markprompt.com/s/[key]]).
    //   await checkWhitelistedDomainIfProjectKey(
    //     supabaseAdmin,
    //     projectKey,
    //     projectId,
    //     requesterHost,
    //   );
    // } catch (e) {
    //   const apiError = e as ApiError;
    //   return new Response(apiError.message, { status: apiError.code });
    // }
  }

  // if (!projectId) {
  //   return new Response(
  //     'No project found matching the provided key or authorization token.',
  //     { status: 401 },
  //   );
  // }

  if (!url) {
    return noTokenOrProjectKeyResponse;
  }

  // We pass the search query string as part of the rewritten response.
  // This is the only way I found to pass along GET query params to the
  // API handler function.
  return NextResponse.rewrite(
    // new URL(`/api/v1/search/${projectId}${req.nextUrl.search}`, req.url),
    new URL(url, req.url),
  );
}
