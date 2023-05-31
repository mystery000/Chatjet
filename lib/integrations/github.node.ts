import { SupabaseClient, User } from '@supabase/supabase-js';
import { sign } from 'jsonwebtoken';
import { Octokit } from 'octokit';
import { isPresent } from 'ts-is-present';

import { Database } from '@/types/supabase';
import { ApiError, FileData, OAuthToken, PathContentData } from '@/types/types';

import {
  decompress,
  getFileType,
  getNameFromPath,
  parseGitHubURL,
  shouldIncludeFileWithPath,
} from '../utils';

export const isGitHubRepoAccessible = async (
  url: string,
  accessToken?: string,
) => {
  const octokit = new Octokit(accessToken ? { auth: accessToken } : {});
  const info = parseGitHubURL(url);
  if (!info?.owner && !info?.repo) {
    return false;
  }
  try {
    const res = await octokit.request(`GET /repos/${info.owner}/${info.repo}`);
    if (res.status === 200) {
      return true;
    }
  } catch (e) {
    //
  }
  return false;
};

const getRepo = async (owner: string, repo: string, octokit: Octokit) => {
  const res = await octokit.request('GET /repos/{owner}/{repo}', {
    owner,
    repo,
  });
  return res.data;
};

const getDefaultBranch = async (
  owner: string,
  repo: string,
  octokit: Octokit,
) => {
  const _repo = await getRepo(owner, repo, octokit);

  const branchRes = await octokit.request(
    `GET /repos/{owner}/{repo}/branches/{branch}`,
    { owner, repo, branch: _repo.default_branch },
  );

  return branchRes.data;
};

const getTree = async (owner: string, repo: string, octokit: Octokit) => {
  const defaultBranch = await getDefaultBranch(owner, repo, octokit);

  const tree = await octokit.request(
    'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
    {
      owner,
      repo,
      tree_sha: defaultBranch.commit.sha,
      recursive: '1',
    },
  );

  return tree.data.tree;
};

export const getRepositoryMDFilesInfo = async (
  url: string,
  includeGlobs: string[],
  excludeGlobs: string[],
  accessToken: string | undefined,
): Promise<{ name: string; path: string; url: string; sha: string }[]> => {
  const info = parseGitHubURL(url);
  if (!info?.owner && !info?.repo) {
    return [];
  }

  // We don't require the user to provide an access token in order to
  // fetch the repository file info, e.g. for public repos.
  let octokit: Octokit;
  if (accessToken) {
    octokit = new Octokit({
      auth: accessToken,
    });
  } else {
    octokit = new Octokit();
  }

  const tree = await getTree(info.owner, info.repo, octokit);

  const mdFileUrls = tree
    .map((f) => {
      if (
        f.url &&
        f.path &&
        shouldIncludeFileWithPath(f.path, includeGlobs, excludeGlobs)
      ) {
        let path = f.path;
        if (!path.startsWith('/')) {
          path = '/' + path;
        }
        return {
          name: getNameFromPath(f.path),
          path,
          url: f.url,
          sha: f.sha || '',
        };
      }
      return undefined;
    })
    .filter(isPresent);
  return mdFileUrls;
};

const paginatedFetchRepo = async (
  owner: string,
  repo: string,
  offset: number,
  includeGlobs: string[],
  excludeGlobs: string[],
): Promise<{ files: PathContentData[]; capped?: boolean }> => {
  const res = await fetch('/api/github/fetch', {
    method: 'POST',
    body: JSON.stringify({ owner, repo, offset, includeGlobs, excludeGlobs }),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new ApiError(res.status, (await res.json()).error);
  }
  const ab = await res.arrayBuffer();
  return JSON.parse(decompress(Buffer.from(ab)));
};

export const getGitHubFiles = async (
  url: string,
  includeGlobs: string[],
  excludeGlobs: string[],
): Promise<FileData[]> => {
  const info = parseGitHubURL(url);
  if (!info?.owner && !info?.repo) {
    return [];
  }

  let data = await paginatedFetchRepo(
    info.owner,
    info.repo,
    0,
    includeGlobs,
    excludeGlobs,
  );

  let allFilesData = data.files;

  while (data.capped) {
    data = await paginatedFetchRepo(
      info.owner,
      info.repo,
      allFilesData.length,
      includeGlobs,
      excludeGlobs,
    );
    allFilesData = [...allFilesData, ...data.files];
  }

  return allFilesData.map((fileData) => {
    const name = getNameFromPath(fileData.path);
    const fileType = getFileType(name);
    return {
      ...fileData,
      fileType,
      name: getNameFromPath(fileData.path),
    };
  });
};

export const getOrRefreshAccessToken = async (
  userId: User['id'],
  supabase: SupabaseClient<Database>,
): Promise<OAuthToken | undefined> => {
  if (!process.env.NEXT_PUBLIC_GITHUB_APP_CLIENT_ID) {
    throw new ApiError(400, 'Invalid GitHub client id.');
  }

  const { data, error } = await supabase
    .from('user_access_tokens')
    .select('*')
    .match({ user_id: userId, provider: 'github' })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error retrieving access token:', error.message);
    throw new ApiError(400, 'Unable to retrieve access token.');
  }

  if (!data || !data.refresh_token_expires || !data.expires) {
    return undefined;
  }

  const now = Date.now();
  if (data.refresh_token_expires < now || !data.refresh_token) {
    throw new ApiError(400, 'Refresh token has expired. Please sign in again.');
  }

  if (data.expires >= now) {
    return data;
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_GITHUB_APP_CLIENT_ID,
      client_secret: process.env.GITHUB_APP_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: data.refresh_token,
    }),
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new ApiError(
      500,
      'Could not refresh access token. Please sign in again',
    );
  }

  const accessTokenInfo = await res.json();

  const { data: refreshedData, error: refreshError } = await supabase
    .from('user_access_tokens')
    .update({
      access_token: accessTokenInfo.access_token,
      expires: now + accessTokenInfo.expires_in * 1000,
      refresh_token: accessTokenInfo.refresh_token,
      refresh_token_expires:
        now + accessTokenInfo.refresh_token_expires_in * 1000,
      scope: accessTokenInfo.scope,
    })
    .eq('id', data.id)
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (refreshError) {
    console.error('Error saving updated token:', refreshError.message);
  }

  if (refreshedData) {
    return refreshedData;
  }

  return undefined;
};

export const getJWT = () => {
  if (!process.env.GITHUB_PRIVATE_KEY) {
    throw new Error('Missing GitHub private key');
  }

  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 10 * 60, // Token expires in 10 minutes
    iss: process.env.GITHUB_MARKPROMPT_APP_ID,
  };

  return sign(payload, process.env.GITHUB_PRIVATE_KEY, {
    algorithm: 'RS256',
  });
};
