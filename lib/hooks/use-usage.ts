import { useMemo } from 'react';
import useSWR from 'swr';

import { FileStats } from '@/types/types';

import useFiles from './use-files';
import useSources from './use-sources';
import useTeam from './use-team';
import { getNumWebsitePagesPerProjectAllowance } from '../stripe/tiers';
import { fetcher } from '../utils';

export default function useUsage() {
  const { team } = useTeam();
  const { files } = useFiles();
  const { sources } = useSources();
  const {
    data: fileStats,
    mutate,
    error,
  } = useSWR(
    team?.id ? `/api/team/${team.id}/file-stats` : null,
    fetcher<FileStats>,
  );

  const loading = !fileStats && !error;

  const numWebsitePagesPerProjectAllowance =
    (team && getNumWebsitePagesPerProjectAllowance(team)) || 0;

  const numWebsitePagesInProject = useMemo(() => {
    const websiteSourceIds = sources
      .filter((s) => s.type === 'website')
      .map((s) => s.id);
    const websiteFiles = files?.filter(
      (f) => f.source_id && websiteSourceIds.includes(f.source_id),
    );
    return websiteFiles?.length || 0;
  }, [sources, files]);

  return {
    numFilesInAllProjects: fileStats?.numFiles || 0,
    numWebsitePagesPerProjectAllowance,
    numWebsitePagesInProject,
    loading,
    mutate,
  };
}
