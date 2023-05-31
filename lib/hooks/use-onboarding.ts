import Router from 'next/router';
import { useCallback } from 'react';

import { updateUser } from '@/lib/api';

import useProject from './use-project';
import useTeam from './use-team';
import useUser from './use-user';

export default function useOnboarding() {
  const { team } = useTeam();
  const { project } = useProject();
  const { mutate: mutateUser } = useUser();

  const finishOnboarding = useCallback(async () => {
    const data = { has_completed_onboarding: true };
    await updateUser(data);
    await mutateUser();
    if (team && project) {
      Router.push({
        pathname: '/[team]/[project]/data',
        query: { team: team.slug, project: project.slug },
      });
    }
  }, [mutateUser, project, team]);

  return { finishOnboarding };
}
