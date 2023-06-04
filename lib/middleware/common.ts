import { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest } from 'next';
import { NextRequest, NextResponse } from 'next/server';

import { Database } from '@/types/supabase';
import { ApiError, Project } from '@/types/types';

import { isSKTestKey, truncateMiddle } from '../utils';
import { isAppHost } from '../utils.edge';

export const noTokenResponse = new NextResponse(
  JSON.stringify({
    success: false,
    message:
      'An authorization token needs to be provided. Head over to the Markprompt dashboard and get one under the project settings.',
  }),
  { status: 401, headers: { 'content-type': 'application/json' } },
);

export const noTokenOrProjectKeyResponse = new NextResponse(
  JSON.stringify({
    success: false,
    message:
      'An authorization token or a project key needs to be provided. Head over to the Markprompt dashboard and get one under the project settings. Read more on https://markprompt.com/docs.',
  }),
  { status: 401, headers: { 'content-type': 'application/json' } },
);

export const noProjectForTokenResponse = new NextResponse(
  JSON.stringify({
    success: false,
    message:
      'No project was found matching the provided token. Head over to the Markprompt dashboard and get a valid token under the project settings.',
  }),
  { status: 401, headers: { 'content-type': 'application/json' } },
);

export const getProjectIdFromToken = async (
  req: NextRequest,
  res: NextResponse,
  supabase: SupabaseClient<Database>,
  token: string,
) => {
  // In un-authed scenarios, supabase needs to have service_role
  // access as the tokens table has RLS.
  const { data } = await supabase
    .from('tokens')
    .select('project_id')
    .eq('value', token)
    .maybeSingle();

  return data?.project_id;
};

// Cf. https://stackoverflow.com/questions/68338838/how-to-get-the-ip-address-of-the-client-from-server-side-in-next-js-app
export const getRequesterIp = (req: NextApiRequest) => {
  const forwarded = req.headers['x-forwarded-for'];

  return typeof forwarded === 'string'
    ? forwarded.split(/, /)[0]
    : req.socket.remoteAddress;
};

export const getProjectIdFromKey = async (
  supabaseAdmin: SupabaseClient<Database>,
  projectKey: string,
): Promise<Project['id']> => {
  const _isSKTestKey = isSKTestKey(projectKey);

  // Admin supabase needed here, as the projects table is subject to RLS
  const { data } = await supabaseAdmin
    .from('projects')
    .select('id')
    .match(
      _isSKTestKey
        ? { private_dev_api_key: projectKey }
        : { public_api_key: projectKey },
    )
    .limit(1)
    .select()
    .maybeSingle();

  if (!data?.id) {
    console.error('Project not found', truncateMiddle(projectKey || ''));
    throw new ApiError(
      404,
      `No project with projectKey ${truncateMiddle(
        projectKey,
      )} was found. Please provide a valid project key. You can obtain your project key in the Markprompt dashboard, under project settings.`,
    );
  }

  return data.id;
};

export const checkWhitelistedDomainIfProjectKey = async (
  supabaseAdmin: SupabaseClient<Database>,
  projectKey: string,
  projectId: Project['id'],
  requesterHost: string | null,
) => {
  const _isSKTestKey = isSKTestKey(projectKey);
  if (!_isSKTestKey && !isAppHost(requesterHost!)) {
    const { count } = await supabaseAdmin
      .from('domains')
      .select('id', { count: 'exact' })
      .match({ project_id: projectId, name: requesterHost });

    if (count === 0) {
      throw new ApiError(
        401,
        `The domain ${requesterHost} is not allowed to access completions for the project with key ${truncateMiddle(
          projectKey,
        )}. If you need to access completions from a non-whitelisted domain, such as localhost, use a test project key instead.`,
      );
    }
  }
};
