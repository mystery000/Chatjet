import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getSource } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Project, Source, SourceType } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | Source[]
  | Source;

const allowedMethods = ['POST', 'GET', 'DELETE'];

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

  const projectId = req.query.id as Project['id'];

  if (req.method === 'GET') {
    const { data: sources, error } = await supabase
      .from('sources')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(sources);
  } else if (req.method === 'POST') {
    const sourceType = req.body.type as SourceType;
    const data = req.body.data as any;

    const source = await getSource(supabase, projectId, sourceType, data);
    if (source) {
      return res.status(400).json({ error: 'Source already exists' });
    }

    const { error, data: newSource } = await supabase
      .from('sources')
      .insert([
        {
          project_id: projectId,
          type: sourceType,
          data,
        },
      ])
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!newSource) {
      return res.status(400).json({ error: 'Error generating token.' });
    }

    return res.status(200).json(newSource);
  } else if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', req.body.id);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ status: 'ok' });
  }

  return res.status(400).end();
}
