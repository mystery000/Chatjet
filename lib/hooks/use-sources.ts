import useSWR from 'swr';

import { Source } from '@/types/types';

import useProject from './use-project';
import { fetcher } from '../utils';

export default function useSources() {
  const { project } = useProject();
  const {
    data: sources,
    mutate,
    error,
  } = useSWR(
    project?.id ? `/api/project/${project.id}/sources` : null,
    fetcher<Source[]>,
  );

  const loading = !sources && !error;

  return { sources: (sources || []) as Source[], loading, mutate };
}
