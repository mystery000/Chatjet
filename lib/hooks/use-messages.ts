import useSWR from 'swr';

import { Message } from '@/types/types';

import useProject from './use-project';
import { fetcher } from '../utils';

export default function useMessages() {
  const { project } = useProject();
  const {
    data: messages,
    mutate,
    error,
  } = useSWR(
    project?.id ? `/api/project/${project.id}/messages` : null,
    fetcher<Message[]>,
  );

  const loading = !messages && !error;

  return { messages: (messages || []) as Message[], loading, mutate };
}
