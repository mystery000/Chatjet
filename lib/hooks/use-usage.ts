import useSWR from 'swr';

import { FileStats } from '@/types/types';

import useTeam from './use-team';
import { getNumTokensPerTeamAllowance } from '../stripe/tiers';
import { fetcher } from '../utils';

export default function useUsage() {
  const { team } = useTeam();
  const {
    data: fileStats,
    mutate,
    error,
  } = useSWR(
    team?.id ? `/api/team/${team.id}/file-stats` : null,
    fetcher<FileStats>,
  );

  const loading = !fileStats && !error;

  const numTokensPerTeamAllowance =
    (team &&
      getNumTokensPerTeamAllowance(
        !!team.is_enterprise_plan,
        team.stripe_price_id,
      )) ||
    0;

  const numTokensPerTeamRemainingAllowance =
    numTokensPerTeamAllowance === 'unlimited'
      ? numTokensPerTeamAllowance
      : Math.max(0, numTokensPerTeamAllowance - (fileStats?.tokenCount || 0));

  return {
    numTokensInTeam: fileStats?.tokenCount || 0,
    numTokensPerTeamAllowance,
    numTokensPerTeamRemainingAllowance,
    loading,
    mutate,
  };
}
