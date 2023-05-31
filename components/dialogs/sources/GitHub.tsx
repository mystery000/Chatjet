import * as Dialog from '@radix-ui/react-dialog';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { track } from '@vercel/analytics';
import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikErrors,
  FormikValues,
} from 'formik';
import { groupBy } from 'lodash-es';
import { Package2 } from 'lucide-react';
import Link from 'next/link';
import { FC, ReactNode, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { GitHubIcon } from '@/components/icons/GitHub';
import Button from '@/components/ui/Button';
import { ErrorLabel } from '@/components/ui/Forms';
import { NoAutoInput } from '@/components/ui/Input';
import { Note } from '@/components/ui/Note';
import { addSource, deleteSource } from '@/lib/api';
import useGitHub from '@/lib/hooks/integrations/use-github';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import useTeam from '@/lib/hooks/use-team';
import useUser from '@/lib/hooks/use-user';
import useOAuth from '@/lib/hooks/utils/use-oauth';
import { isGitHubRepoAccessible } from '@/lib/integrations/github.node';
import { setGitHubAuthState } from '@/lib/supabase';
import { getLabelForSource } from '@/lib/utils';
import { GitHubRepository, Project } from '@/types/types';

const _addSource = async (
  projectId: Project['id'],
  url: string,
  mutate: () => void,
) => {
  try {
    const newSource = await addSource(projectId, 'github', {
      url,
    });
    await mutate();
    toast.success(
      `The source ${getLabelForSource(
        newSource,
      )} has been added to the project.`,
    );
  } catch (e) {
    console.error(e);
    toast.error(`${e}`);
  }
};

type ConnectButtonProps = {
  projectId: Project['id'];
  repository: GitHubRepository;
  onComplete?: () => void;
  clearPrevious?: boolean;
};

const ConnectButton: FC<ConnectButtonProps> = ({
  projectId,
  repository,
  onComplete,
  clearPrevious,
}) => {
  const { sources, mutate } = useSources();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      className="flex-none"
      variant="plain"
      buttonSize="sm"
      type="submit"
      loading={loading}
      onClick={async () => {
        track('connect private github repo', { projectId });
        setLoading(true);
        if (clearPrevious) {
          for (const source of sources) {
            await deleteSource(projectId, source.id);
          }
        }
        await _addSource(projectId, repository.url, mutate);
        setLoading(false);
        onComplete?.();
      }}
    >
      Connect
    </Button>
  );
};

type GitHubSourceProps = {
  clearPrevious?: boolean;
  onDidAddSource: () => void;
};

export const GitHubSource: FC<GitHubSourceProps> = ({
  clearPrevious,
  onDidAddSource,
}) => {
  const { project } = useProject();
  const { user } = useUser();
  const { sources, mutate } = useSources();
  const { showAuthPopup, githubAccessToken } = useOAuth();
  const {
    repositories,
    tokenState,
    loading: loadingRepositories,
  } = useGitHub();
  const [supabase] = useState(() => createBrowserSupabaseClient());

  const repositoriesByOwner = useMemo(() => {
    return groupBy(repositories, 'owner');
  }, [repositories]);

  if (!user) {
    return <></>;
  }

  return (
    <>
      <Formik
        initialValues={{ repoUrl: '' }}
        validateOnMount
        validate={async (values) => {
          const errors: FormikErrors<FormikValues> = {};
          if (values.repoUrl) {
            const isAccessible = await isGitHubRepoAccessible(
              values.repoUrl,
              githubAccessToken?.access_token || undefined,
            );
            if (!isAccessible) {
              errors.repoUrl = 'Repository is not accessible';
            }
          }
          return errors;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          if (!project || !values.repoUrl) {
            return;
          }
          setSubmitting(true);
          if (clearPrevious) {
            for (const source of sources) {
              await deleteSource(project.id, source.id);
            }
          }
          await _addSource(project.id, values.repoUrl, mutate);
          setSubmitting(false);
          onDidAddSource();
        }}
      >
        {({ isSubmitting, isValid }) => (
          <Form className="h-full flex-grow">
            <div className="flex h-full flex-grow flex-col gap-2">
              <div className="h-flex-none mt-4 flex flex-col gap-1 px-4">
                <p className="mb-1 flex-none text-sm font-medium text-neutral-300">
                  Repository URL
                </p>
                <div className="flex flex-none flex-row gap-2">
                  <Field
                    className="flex-grow"
                    type="text"
                    name="repoUrl"
                    inputSize="sm"
                    as={NoAutoInput}
                    disabled={isSubmitting}
                  />
                  <Button
                    className="flex-none"
                    disabled={!isValid}
                    loading={isSubmitting}
                    variant="plain"
                    buttonSize="sm"
                    type="submit"
                  >
                    Connect
                  </Button>
                </div>
                <ErrorMessage name="repoUrl" component={ErrorLabel} />
                <Note size="sm" className="mt-4" type="warning">
                  Make sure the repository allows you to index its content. Do
                  not build on top of other people&apos;s work unless you have
                  explicit authorization to do so.
                </Note>
              </div>
              <p className="mb-1 mt-6 flex-none px-4 text-sm font-medium text-neutral-300">
                Your repositories
              </p>
              {(tokenState === 'no_token' || tokenState === 'expired') && (
                <div className="px-4">
                  <p className="text-sm text-neutral-500">
                    Connect your GitHub account to sync private repositories.
                  </p>
                  <div>
                    <Button
                      className="mt-2"
                      variant="plain"
                      buttonSize="sm"
                      Icon={tokenState === 'no_token' ? GitHubIcon : undefined}
                      onClick={async () => {
                        const state = await setGitHubAuthState(
                          supabase,
                          user.id,
                        );
                        const authed = await showAuthPopup('github', state);
                        if (authed) {
                          toast.success('Authorization has been granted.');
                        }
                      }}
                    >
                      {tokenState === 'no_token'
                        ? 'Authorize GitHub'
                        : 'Re-authorize'}
                    </Button>
                  </div>
                </div>
              )}
              <div className="relative flex h-full flex-grow flex-col gap-2">
                {!loadingRepositories &&
                  (!repositories || repositories.length === 0) && (
                    <p className="px-4 text-sm text-neutral-500">
                      No repositories found
                    </p>
                  )}
                <div className="absolute inset-0 flex flex-col gap-4 overflow-y-auto p-4">
                  {tokenState === 'valid' && loadingRepositories && (
                    <div className="flex animate-pulse flex-col gap-4">
                      <div className="h-4 w-48 rounded bg-neutral-900" />
                      <div className="h-8 rounded bg-neutral-900" />
                      <div className="h-8 rounded bg-neutral-900" />
                      <div className="h-8 rounded bg-neutral-900" />
                    </div>
                  )}
                  {!loadingRepositories &&
                    project &&
                    Object.keys(repositoriesByOwner)?.map((owner) => {
                      const repositories = repositoriesByOwner[owner];
                      return (
                        <div key={owner}>
                          <p className="mb-4 text-xs uppercase text-neutral-500">
                            {owner}
                          </p>
                          <div className="flex flex-col gap-2">
                            {repositories.map((repo) => (
                              <div
                                key={repo.url}
                                className="flex flex-row items-center gap-3"
                              >
                                <Package2 className="h-4 w-4 flex-none text-neutral-500" />
                                <span className="flex-grow text-sm font-medium text-neutral-300">
                                  {repo.name}
                                </span>
                                <ConnectButton
                                  projectId={project.id}
                                  repository={repo}
                                  onComplete={() => {
                                    onDidAddSource();
                                  }}
                                  clearPrevious={!!clearPrevious}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

const GitHubAddSourceDialog = ({
  onDidAddSource,
  children,
}: {
  onDidAddSource?: () => void;
  children: ReactNode;
}) => {
  const { team } = useTeam();
  const { project } = useProject();
  const [githubDialogOpen, setGithubDialogOpen] = useState(false);

  return (
    <Dialog.Root open={githubDialogOpen} onOpenChange={setGithubDialogOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
        <Dialog.Content className="animate-dialog-slide-in dialog-content flex h-[90%] max-h-[600px] w-[90%] max-w-[500px] flex-col">
          <Dialog.Title className="dialog-title flex-none">
            Connect GitHub repo
          </Dialog.Title>
          <div className="dialog-description flex flex-none flex-col gap-2 border-b border-neutral-900 pb-4">
            <p>
              Sync files from a GitHub repo. You can specify which files to
              include and exclude from the repository in the{' '}
              <Link
                className="subtle-underline"
                href={`/${team?.slug}/${project?.slug}/settings`}
              >
                project configuration
              </Link>
              .
            </p>
            <p>
              <span className="font-semibold">Note</span>: Syncing large
              repositories (&gt;100 Mb) is not yet supported. In this case, we
              recommend using file uploads or the{' '}
              <a
                className="subtle-underline"
                href="https://markprompt.com/docs#train-content"
              >
                train API
              </a>
              .
            </p>
          </div>
          <div className="flex-grow">
            <GitHubSource
              onDidAddSource={() => {
                setGithubDialogOpen(false);
                onDidAddSource?.();
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default GitHubAddSourceDialog;
