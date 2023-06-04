import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  getTeamUsageInfoByTeamOrProject,
  getTokenAllowanceInfo,
} from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { FileStats, Team } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | FileStats;

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

  const teamId = req.query.id as Team['id'];

  const tokenAllowanceInfo = await getTokenAllowanceInfo(supabase, {
    teamId,
  });

  if (req.method === 'GET') {
    return res.status(200).json({ tokenCount: tokenAllowanceInfo.usedTokens });
  }

  return res.status(200).json({ status: 'ok' });
}
