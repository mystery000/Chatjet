import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getOrRefreshAccessToken } from '@/lib/integrations/github.node';
import { Database } from '@/types/supabase';
import { ApiError, OAuthToken } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | OAuthToken[];

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
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // For now, we only handle GitHub auth.
    const githubToken = await getOrRefreshAccessToken(
      session.user.id,
      supabase,
    );
    return res.status(200).json(githubToken ? [githubToken] : []);
  } catch (e) {
    if (e instanceof ApiError) {
      return res.status(e.code).json({ error: e.message });
    } else {
      return res.status(400).json({ error: `${e}` });
    }
  }
}
