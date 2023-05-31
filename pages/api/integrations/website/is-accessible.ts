import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { Database } from '@/types/supabase';

type Data = {
  status?: string;
  error?: string;
};

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

  const url = req.body.url as string;
  if (!url) {
    return res.status(400).json({
      error: 'Invalid request. Please provide a url.',
    });
  }

  try {
    const websiteRes = await fetch(url);
    if (websiteRes.ok) {
      return res.status(200).json({ status: 'ok' });
    }
  } catch {
    // Handle below
  }

  return res.status(400).json({ status: 'Website is not available' });
}
