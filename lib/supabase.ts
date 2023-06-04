import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { PostgrestError } from '@supabase/supabase-js';

import { Database } from '@/types/supabase';
import {
  DbUser,
  GitHubSourceDataType,
  MotifSourceDataType,
  OAuthProvider,
  Project,
  Source,
  SourceType,
  Team,
  WebsiteSourceDataType,
} from '@/types/types';

import { DEFAULT_MARKPROMPT_CONFIG } from './constants';
import { MarkpromptConfig } from './schema';
import { TokenAllowance, getNumTokensPerTeamAllowance } from './stripe/tiers';
import { generateKey } from './utils';

export const getBYOOpenAIKey = async (
  supabaseAdmin: SupabaseClient<Database>,
  projectId: Project['id'],
): Promise<string | undefined> => {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('openai_key')
    .eq('id', projectId)
    .limit(1)
    .select()
    .maybeSingle();

  return data?.openai_key || undefined;
};

export const getProjectConfigData = async (
  supabaseAdmin: SupabaseClient<Database>,
  projectId: Project['id'],
): Promise<{
  byoOpenAIKey: string | undefined;
  markpromptConfig: MarkpromptConfig;
}> => {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('openai_key,markprompt_config')
    .eq('id', projectId)
    .limit(1)
    .select()
    .maybeSingle();

  // We cannot use Ajv in edge runtimes, so use non-typesafe
  // parsing and assume the format is correct. Cf.
  // https://github.com/vercel/next.js/discussions/47063
  const markpromptConfig = (data?.markprompt_config ||
    JSON.parse(DEFAULT_MARKPROMPT_CONFIG)) as MarkpromptConfig;

  return {
    byoOpenAIKey: data?.openai_key || undefined,
    markpromptConfig: markpromptConfig,
  };
};

export const getTeamStripeInfo = async (
  supabaseAdmin: SupabaseClient<Database>,
  projectId: Project['id'],
): Promise<
  { stripePriceId: string | null; isEnterprisePlan: boolean } | undefined
> => {
  const { data } = await supabaseAdmin
    .from('teams')
    .select('stripe_price_id, is_enterprise_plan, projects!inner (id)')
    .match({ 'projects.id': projectId })
    .limit(1)
    .maybeSingle();

  return data
    ? {
        stripePriceId: data.stripe_price_id,
        isEnterprisePlan: !!data.is_enterprise_plan,
      }
    : undefined;
};

export const setGitHubAuthState = async (
  supabase: SupabaseClient<Database>,
  userId: DbUser['id'],
): Promise<string> => {
  const state = generateKey();
  const { data } = await supabase
    .from('user_access_tokens')
    .select('id')
    .match({ user_id: userId, provider: 'github' })
    .limit(1)
    .maybeSingle();
  if (data) {
    await supabase
      .from('user_access_tokens')
      .update({ state })
      .eq('id', data.id);
  } else {
    await supabase
      .from('user_access_tokens')
      .insert([{ user_id: userId, state, provider: 'github' }]);
  }
  return state;
};

export const deleteUserAccessToken = async (
  supabase: SupabaseClient<Database>,
  userId: DbUser['id'],
  provider: OAuthProvider,
): Promise<PostgrestError | null> => {
  const { error } = await supabase
    .from('user_access_tokens')
    .delete()
    .match({ user_id: userId, provider });
  return error;
};

export const getProjectIdFromSource = async (
  supabaseAdmin: SupabaseClient<Database>,
  sourceId: Source['id'],
): Promise<Project['id'] | undefined> => {
  const { data } = await supabaseAdmin
    .from('sources')
    .select('project_id')
    .eq('id', sourceId)
    .limit(1)
    .maybeSingle();
  return data?.project_id || undefined;
};

export const getOrCreateSource = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  type: SourceType,
  data: any | undefined,
): Promise<Source['id']> => {
  const source = await getSource(supabase, projectId, type, data);

  if (source?.id) {
    return source.id;
  }

  const { data: newSourceData } = await supabase
    .from('sources')
    .insert([{ project_id: projectId, type }])
    .select('id')
    .limit(1)
    .maybeSingle();

  return newSourceData!.id;
};

export const getSource = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
  sourceType: SourceType,
  data: any,
): Promise<Source | undefined> => {
  const { data: sources, error } = await supabase
    .from('sources')
    .select('*')
    .match({ project_id: projectId, type: sourceType });

  if (error || !sources || sources.length === 0) {
    return undefined;
  }

  switch (sourceType) {
    case 'file-upload':
    case 'api-upload':
      return sources[0];
    case 'github':
      return sources.find((s) => {
        const _data = s.data as GitHubSourceDataType;
        return _data.url && _data.url === data.url;
      });
    case 'motif': {
      return sources.find((s) => {
        const _data = s.data as MotifSourceDataType;
        return (
          _data.projectDomain && _data.projectDomain === data.projectDomain
        );
      });
    }
    case 'website': {
      return sources.find((s) => {
        const _data = s.data as WebsiteSourceDataType;
        return _data.url && _data.url === data.url;
      });
    }
  }
};

export const getChecksums = async (
  supabase: SupabaseClient<Database>,
  sourceId: Source['id'],
) => {
  const { data } = await supabase
    .from('files')
    .select('path,checksum')
    .eq('source_id', sourceId);
  return data || [];
};

export const getProjectTeam = async (
  supabase: SupabaseClient<Database>,
  projectId: Project['id'],
): Promise<Team | undefined> => {
  const { data: projectData } = await supabase
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .limit(1)
    .maybeSingle();
  if (projectData?.team_id) {
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', projectData.team_id)
      .limit(1)
      .maybeSingle();
    return teamData || undefined;
  }

  return undefined;
};

export const getTeamUsageInfoByTeamOrProject = async (
  supabase: SupabaseClient<Database>,
  teamOrProjectId: { teamId?: Team['id']; projectId?: Project['id'] },
): Promise<{
  is_enterprise_plan: boolean;
  stripe_price_id: string | null;
  team_token_count: number;
}> => {
  // eslint-disable-next-line prefer-const
  let { data, error } = await supabase
    .from('v_team_project_usage_info')
    .select('is_enterprise_plan,stripe_price_id,team_token_count')
    .eq(
      teamOrProjectId.teamId ? 'team_id' : 'project_id',
      teamOrProjectId.teamId ?? teamOrProjectId.projectId,
    )
    .limit(1)
    .maybeSingle();

  // Important: data will be null in the above query if no content has been
  // indexed. In that case, just fetch the team plan details.
  if (!data || error) {
    const {
      data: teamProjectInfoData,
    }: {
      data: {
        is_enterprise_plan: boolean | null;
        stripe_price_id: string | null;
        team_token_count: number | null;
      } | null;
    } = await supabase
      .from('v_team_project_info')
      .select('is_enterprise_plan,stripe_price_id')
      .eq(
        teamOrProjectId.teamId ? 'team_id' : 'project_id',
        teamOrProjectId.teamId ?? teamOrProjectId.projectId,
      )
      .limit(1)
      .maybeSingle();

    data = teamProjectInfoData;
  }

  return {
    is_enterprise_plan: !!data?.is_enterprise_plan,
    stripe_price_id: data?.stripe_price_id || null,
    team_token_count: data?.team_token_count || 0,
  };
};

export const getTokenAllowanceInfo = async (
  supabase: SupabaseClient<Database>,
  teamOrProjectId: { teamId?: Team['id']; projectId?: Project['id'] },
): Promise<{
  numRemainingTokensOnPlan: number;
  usedTokens: number;
  tokenAllowance: TokenAllowance;
}> => {
  const teamUsageInfo = await getTeamUsageInfoByTeamOrProject(
    supabase,
    teamOrProjectId,
  );
  const usedTokens = teamUsageInfo?.team_token_count || 0;
  const tokenAllowance = getNumTokensPerTeamAllowance(
    !!teamUsageInfo?.is_enterprise_plan,
    teamUsageInfo?.stripe_price_id,
  );
  const numRemainingTokensOnPlan =
    tokenAllowance === 'unlimited'
      ? 1_000_000_000
      : Math.max(0, tokenAllowance - usedTokens);
  return { numRemainingTokensOnPlan, usedTokens, tokenAllowance };
};

export const refreshMaterializedViews = async (
  supabaseAdmin: SupabaseClient<Database>,
  views: (keyof Database['public']['Views'])[],
) => {
  // TODO
  console.log('No implemented yet');
  // for (const viewName of views) {
  //   const { error } = await supabaseAdmin.rpc('refresh_materialized_view', {
  //     view_name: viewName,
  //   });
  //   console.error(error);
  // }
};
