import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getOrRefreshAccessToken } from '@/lib/integrations/github.node';
import { Database } from '@/types/supabase';
import { GitHubRepository } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | GitHubRepository[];

const allowedMethods = ['GET'];

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

  const repositories: GitHubRepository[] = [];
  for (const installation of json.installations) {
    const repositoriesRes = await fetch(
      `https://api.github.com/user/installations/${installation.id}/repositories`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${accessToken.access_token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (repositoriesRes.ok) {
      const repositoriesForInstallation = await repositoriesRes.json();
      for (const repo of repositoriesForInstallation.repositories) {
        repositories.push({
          name: repo.name,
          owner: repo.owner.login,
          url: repo.html_url,
        });
      }
    }
  }

  return res.status(200).json(repositories);
}
