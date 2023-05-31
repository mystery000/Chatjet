import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

import { Database } from '@/types/supabase';

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ status: 'Application was not authorized.' });
  }

  console.error(
    'NEXT_PUBLIC_GITHUB_APP_CLIENT_ID',
    process.env.NEXT_PUBLIC_GITHUB_APP_CLIENT_ID?.substring(0, 5),
  );
  console.error(
    'GITHUB_APP_CLIENT_SECRET',
    process.env.GITHUB_APP_CLIENT_SECRET?.substring(0, 5),
  );
  console.error('code', (code as string)?.substring(0, 5));

  const accessTokenRes = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_GITHUB_APP_CLIENT_ID,
        client_secret: process.env.GITHUB_APP_CLIENT_SECRET,
        code,
      }),
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    },
  );

  if (!accessTokenRes.ok) {
    console.error('ERROR!');
    return res
      .status(accessTokenRes.status)
      .json({ status: await accessTokenRes.text() });
  }

  const accessTokenInfo = await accessTokenRes.json();

  if (accessTokenInfo.error_description) {
    return res.status(400).json({ status: accessTokenInfo.error_description });
  }

  const userInfoRes = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: 'Bearer ' + accessTokenInfo.access_token,
    },
  });

  if (!userInfoRes.ok) {
    return res
      .status(400)
      .json({ status: 'Unable to retrieve authorized user info.' });
  }

  const userInfo = await userInfoRes.json();

  const now = Date.now();
  const { error } = await supabaseAdmin
    .from('user_access_tokens')
    .update({
      access_token: accessTokenInfo.access_token,
      expires: now + accessTokenInfo.expires_in * 1000,
      refresh_token: accessTokenInfo.refresh_token,
      refresh_token_expires:
        now + accessTokenInfo.refresh_token_expires_in * 1000,
      scope: accessTokenInfo.scope,
      meta: {
        login: userInfo.login,
      },
    })
    .eq('state', state);

  if (error) {
    return res.status(400).json({ status: error.message });
  }

  return res.status(200).json({ status: 'ok' });
}
