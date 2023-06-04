import { getResponseOrThrow, slugFromName } from '@/lib/utils';
import { Database } from '@/types/supabase';
import {
  DbFile,
  DbUser,
  Domain,
  FileData,
  Project,
  PromptConfig,
  Source,
  SourceType,
  Team,
  Token,
} from '@/types/types';

export const updateUser = async (values: Partial<DbUser>): Promise<DbUser> => {
  const res = await fetch('/api/user', {
    method: 'PATCH',
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow(res);
};

export const deleteUserAndMembershipsAndTeams = async () => {
  const res = await fetch('/api/user', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow(res);
};

export const updateProject = async (
  id: Project['id'],
  values: Partial<Project>,
): Promise<Project> => {
  const res = await fetch(`/api/project/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Project>(res);
};

export const createPromptConfig = async (
  id: Project['id'],
  shareKey: string,
  config: any,
): Promise<PromptConfig> => {
  const res = await fetch(`/api/project/${id}/prompt-configs`, {
    method: 'POST',
    body: JSON.stringify({ shareKey, config }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<PromptConfig>(res);
};

export const deletePromptConfig = async (
  id: Project['id'],
  promptConfigId: PromptConfig['id'],
): Promise<Project> => {
  const res = await fetch(`/api/project/${id}/prompt-configs`, {
    method: 'DELETE',
    body: JSON.stringify({ promptConfigId }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Project>(res);
};

export const processFile = async (
  sourceId: Source['id'],
  fileData: FileData,
) => {
  const res = await fetch('/api/v1/openai/train-file', {
    method: 'POST',
    body: JSON.stringify({
      file: fileData,
      sourceId,
    }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow<void>(res);
};

export const deleteFiles = async (
  projectId: Project['id'],
  ids: DbFile['id'][],
) => {
  return fetch(`/api/project/${projectId}/files`, {
    method: 'DELETE',
    body: JSON.stringify(ids),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
};

export const setHasCompletedOnboarding = async () => {
  await fetch('/api/user', {
    method: 'PATH',
    body: JSON.stringify({ has_completed_onboarding: true }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
};

export const initUserData = async (): Promise<{
  team: Team;
  project: Project;
}> => {
  const res = await fetch('/api/user/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow<{ team: Team; project: Project }>(res);
};

export const createTeam = async (name: string) => {
  const candidateSlug = slugFromName(name);
  const res = await fetch('/api/teams', {
    method: 'POST',
    body: JSON.stringify({ name, candidateSlug }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow<Team>(res);
};

export const updateTeam = async (
  id: Team['id'],
  values: Partial<Team>,
): Promise<Team> => {
  const res = await fetch(`/api/team/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Team>(res);
};

export const deleteTeamAndMemberships = async (
  id: Team['id'],
): Promise<any> => {
  const res = await fetch(`/api/team/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<any>(res);
};

export const createProject = async (teamId: Team['id'], name: string) => {
  const res = await fetch(`/api/team/${teamId}/projects`, {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  return getResponseOrThrow<Project>(res);
};

export const deleteProject = async (projectId: Team['id']) => {
  fetch(`/api/project/${projectId}`, { method: 'DELETE' });
};

export const isTeamSlugAvailable = async (slug: string): Promise<boolean> => {
  const res = await fetch('/api/slug/is-team-slug-available', {
    method: 'POST',
    body: JSON.stringify({ slug }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  try {
    return getResponseOrThrow<boolean>(res);
  } catch {
    return false;
  }
};

export const isProjectSlugAvailable = async (
  teamId: Team['id'],
  slug: string,
): Promise<boolean> => {
  const res = await fetch('/api/slug/is-project-slug-available', {
    method: 'POST',
    body: JSON.stringify({ teamId, slug }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
  try {
    return getResponseOrThrow<boolean>(res);
  } catch {
    return false;
  }
};

export const addDomain = async (
  projectId: Project['id'],
  name: string,
): Promise<Domain> => {
  const res = await fetch(`/api/project/${projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Domain>(res);
};

export const deleteDomain = async (
  projectId: Project['id'],
  id: Domain['id'],
) => {
  fetch(`/api/project/${projectId}/domains`, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });
};

export const addToken = async (projectId: Project['id']): Promise<Token> => {
  const res = await fetch(`/api/project/${projectId}/tokens`, {
    method: 'POST',
    body: JSON.stringify({ projectId }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Token>(res);
};

export const deleteToken = async (
  projectId: Project['id'],
  id: Token['id'],
) => {
  const res = await fetch(`/api/project/${projectId}/tokens`, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });
  return getResponseOrThrow<any>(res);
};

export const addSource = async (
  projectId: Project['id'],
  sourceType: SourceType,
  data: any,
): Promise<Source> => {
  const res = await fetch(`/api/project/${projectId}/sources`, {
    method: 'POST',
    body: JSON.stringify({ projectId, type: sourceType, data }),
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
  });
  return getResponseOrThrow<Source>(res);
};

export const deleteSource = async (
  projectId: Project['id'],
  id: Source['id'],
) => {
  const res = await fetch(`/api/project/${projectId}/sources`, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });
  return getResponseOrThrow<any>(res);
};

export const cancelSubscription = (teamId: Team['id']) => {
  return fetch('/api/subscriptions/cancel', {
    method: 'POST',
    body: JSON.stringify({ teamId }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
};

export const clientRefreshMaterializedViews = (
  views: (keyof Database['public']['Views'])[],
) => {
  return fetch('/api/db/refresh-materialized-views', {
    method: 'POST',
    body: JSON.stringify({ views }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });
};
