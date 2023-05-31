import useSWR from 'swr';

import { fetcher } from '@/lib/utils';
import { GitHubRepository } from '@/types/types';

import useOAuth from '../utils/use-oauth';

export default function useGitHub() {
  const { getTokenState, getTokenData } = useOAuth();

  const tokenState = getTokenState('github');
  const token = getTokenData('github');

  const { data: repositories, error } = useSWR(
    tokenState === 'valid' ? `/api/github/repositories` : null,
    fetcher<GitHubRepository[]>,
  );

  const loading = !repositories && !error;

  return {
    repositories,
    token,
    tokenState,
    loading,
  };
}
