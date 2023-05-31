import { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest } from 'next';
import { NextRequest, NextResponse } from 'next/server';

import { Database } from '@/types/supabase';

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
