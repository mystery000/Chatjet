import { useSession } from '@supabase/auth-helpers-react';
import Router, { useRouter } from 'next/router';
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
} from 'react';

import { initUserData } from '../api';
import useProjects from '../hooks/use-projects';
import useTeam from '../hooks/use-team';
import useTeams from '../hooks/use-teams';
import useUser from '../hooks/use-user';
import { useLocalStorage } from '../hooks/utils/use-localstorage';

export type State = {
  isOnboarding: boolean;
  didCompleteFirstQuery: boolean;
  setDidCompleteFirstQuery: (value: boolean) => void;
};

const initialContextState: State = {
  isOnboarding: false,
  didCompleteFirstQuery: false,
  setDidCompleteFirstQuery: () => {
    // Do nothing
  },
};

const publicRoutes = ['/login', '/signin', '/legal'];

const AppContextProvider = (props: PropsWithChildren) => {
  const router = useRouter();
  const session = useSession();
  const { user, loading: loadingUser } = useUser();
  const { teams, loading: loadingTeams, mutate: mutateTeams } = useTeams();
  const { team } = useTeam();
  const { projects, mutate: mutateProjects } = useProjects();

  const [didCompleteFirstQuery, setDidCompleteFirstQuery] =
    useLocalStorage<boolean>(
      `${user?.id ?? 'undefined'}:onboarding:didCompleteFirstQuery`,
      false,
    );

  // Create personal team if it doesn't exist
  useEffect(() => {
    if (user?.has_completed_onboarding) {
      return;
    }

    if (!user || loadingTeams) {
      return;
    }

    (async () => {
      const team = teams?.find((t) => t.is_personal);
      if (!team) {
        await initUserData();
        await mutateTeams();
        await mutateProjects();
      }
    })();
  }, [
    teams,
    team,
    loadingTeams,
    session?.user,
    user,
    mutateTeams,
    mutateProjects,
  ]);

  useEffect(() => {
    if (!user || user.has_completed_onboarding || router.pathname === '/docs') {
      return;
    }

    if (!teams) {
      return;
    }

    const personalTeam = teams.find((t) => t.is_personal);
    if (!personalTeam) {
      return;
    }

    // If user is onboarding and user is not on the personal
    // team path, redirect to it.
    if (router.query.team !== personalTeam.slug) {
      router.push({
        pathname: '/[team]',
        query: { team: personalTeam.slug },
      });
      return;
    }

    let project = projects?.find((t) => t.is_starter);
    if (!project) {
      // If no starter project is found, find the first one in the list
      // (e.g. if the starter project was deleted).
      project = projects?.[0];
      if (!project) {
        return;
      }
    }

    // If user is onboarding and user is not on the starter
    // project path, redirect to it.
    if (
      router.query.project !== project.slug ||
      router.pathname !== '/[team]/[project]'
    ) {
      router.push({
        pathname: '/[team]/[project]',
        query: { team: personalTeam.slug, project: project.slug },
      });
    }
  }, [router, user, teams, projects]);

  useEffect(() => {
    if (!user || !user.has_completed_onboarding) {
      return;
    }

    if (router.pathname !== '/') {
      return;
    }

    const storedSlug = localStorage.getItem('stored_team_slug');
    const slug = teams?.find((t) => t.slug === storedSlug) || teams?.[0];
    if (slug) {
      Router.push(`/${slug.slug}`);
    }
  }, [
    user,
    loadingUser,
    user?.has_completed_onboarding,
    teams,
    router.pathname,
    router.asPath,
  ]);

  useEffect(() => {
    if (router.query.team) {
      localStorage.setItem('stored_team_slug', `${router.query.team}`);
    }
  }, [router.query.team]);

  useEffect(() => {
    if (router.query.project) {
      localStorage.setItem('stored_project_slug', `${router.query.project}`);
    }
  }, [router.query.project]);

  return (
    <AppContext.Provider
      value={{
        isOnboarding: !loadingUser && !user?.has_completed_onboarding,
        didCompleteFirstQuery,
        setDidCompleteFirstQuery,
      }}
      {...props}
    />
  );
};

export const useAppContext = (): State => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error(`useAppContext must be used within a AppContextProvider`);
  }
  return context;
};

export const AppContext = createContext<State>(initialContextState);

AppContext.displayName = 'AppContext';

export const ManagedAppContext: FC<PropsWithChildren> = ({ children }) => (
  <AppContextProvider>{children}</AppContextProvider>
);
