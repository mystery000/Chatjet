import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  getJWT,
  getOrRefreshAccessToken,
} from '@/lib/integrations/github.node';
import { Database } from '@/types/supabase';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | Buffer;

const allowedMethods = ['POST'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const supabase = createServerSupabaseClient<Database>({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const accessToken = await getOrRefreshAccessToken(session.user.id, supabase);

  if (!accessToken) {
    return res.status(401).json({ error: 'Could not retrieve access token.' });
  }

  const installationsRes = await fetch(
    'https://api.github.com/user/installations',
    {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken.access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!installationsRes.ok) {
    return res
      .status(401)
      .json({ error: 'Unable to fetch list of installations.' });
  }

  const json = await installationsRes.json();

  const jwt = getJWT();

  for (const installation of json.installations) {
    await fetch(`https://api.github.com/app/installations/${installation.id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${jwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  }

  return res.status(200).json({});
}
