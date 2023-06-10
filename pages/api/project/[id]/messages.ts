import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '@/types/supabase';
import { Project, Message } from '@/types/types';

type Data =
    | {
        status?: string;
        error?: string;
    }
    | Message[]
    | Message;

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
        const { data: messages, error } = await supabase
            .from('query_stats')
            .select('*')
            .order('created_at', {ascending: true})
            .eq('project_id', projectId);
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json(messages);
    }
    return res.status(400).end();
}
