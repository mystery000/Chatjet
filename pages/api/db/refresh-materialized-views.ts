import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

import { refreshMaterializedViews } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Data = {
  status?: string;
  error?: string;
};

const allowedMethods = ['POST'];

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

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

  const views = req.body.views;

  if (!views || views.length === 0) {
    return res.status(403).json({
      error: 'Please provide a list of materialized views to refresh',
    });
  }

  await refreshMaterializedViews(supabaseAdmin, views);

  return res.status(200).send({ status: 'ok' });
}
