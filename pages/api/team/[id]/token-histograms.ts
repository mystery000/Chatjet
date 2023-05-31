import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getProjectCompletionsTokenCount } from '@/lib/tinybird';
import { Database } from '@/types/supabase';
import { ProjectUsageHistogram, Team } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | ProjectUsageHistogram[];

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

  const { data } = await supabase
    .from('projects')
    .select('id')
    .match({ team_id: teamId });

  if (!data) {
    return res.status(400).json({ error: 'Unable to retrieve usage data' });
  }

  const startDate = new Date(req.query.startDate as string);
  const endDate = new Date(req.query.endDate as string);

  const usage = await Promise.all(
    data?.map(async (project) => {
      const histogram = await getProjectCompletionsTokenCount(
        project.id,
        startDate,
        endDate,
      );
      return {
        projectId: project.id,
        histogram,
      };
    }),
  );

  if (req.method === 'GET') {
    return res.status(200).json(usage);
  }

  return res.status(200).json({ status: 'ok' });
}
