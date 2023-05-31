import useSWR from 'swr';

import { PromptConfig } from '@/types/types';

import useProject from './use-project';
import { fetcher } from '../utils';

export default function usePromptConfigs() {
  const { project } = useProject();
  const {
    data: promptConfigs,
    mutate,
    error,
  } = useSWR(
    project?.id ? `/api/project/${project.id}/prompt-configs` : null,
    fetcher<PromptConfig[]>,
  );

  const loading = !promptConfigs && !error;

  return { promptConfigs, loading, mutate };
}
