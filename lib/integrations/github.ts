// Note also that GitHub archives include a repo id at the rooth of the paths.
export const getMarkpromptPathFromGitHubArchivePath = (path: string) => {
  return path.split('/').slice(1).join('/');
};
