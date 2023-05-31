import * as Dialog from '@radix-ui/react-dialog';
import cn from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  getTrainingStateMessage,
  TrainingState,
  useTrainingContext,
} from '@/lib/context/training';
import useGitHub from '@/lib/hooks/integrations/use-github';
import useFiles from '@/lib/hooks/use-files';
import useProject from '@/lib/hooks/use-project';
import useProjects from '@/lib/hooks/use-projects';
import useSources from '@/lib/hooks/use-sources';
import { getRepositoryMDFilesInfo } from '@/lib/integrations/github.node';
import { MarkpromptConfigType } from '@/lib/schema';
import { getGitHubOwnerRepoString, pluralize } from '@/lib/utils';
import { ApiError, GitHubSourceDataType, Source } from '@/types/types';

import { GitHubSource } from '../dialogs/sources/GitHub';
import { GitHubIcon } from '../icons/GitHub';
import Button from '../ui/Button';
import { ToggleMessage } from '../ui/ToggleMessage';

type GitHubProps = {
  onTrainingComplete: () => void;
  className?: string;
  ignoreSource?: string;
};

const getReadyMessage = (
  isFetchingRepoInfo: boolean,
  trainingState: TrainingState,
  githubSource: Source | undefined,
  numFiles: number,
  onSelectOtherClick: () => void,
) => {
  if (trainingState.state === 'idle') {
    if (githubSource) {
      return (
        <div className="flex flex-col">
          <p>{pluralize(numFiles, 'file', 'files')} found</p>
          <p className="text-xs text-neutral-500">
            Syncing{' '}
            {getGitHubOwnerRepoString((githubSource.data as any)['url'])}.{' '}
            <span
              className="subtle-underline cursor-pointer"
              onClick={onSelectOtherClick}
            >
              Select another repo
            </span>
            .
          </p>
        </div>
      );
    } else if (isFetchingRepoInfo) {
      return 'Fetching files...';
    }
  }
  return getTrainingStateMessage(trainingState);
};

export const GitHub: FC<GitHubProps> = ({
  ignoreSource,
  onTrainingComplete,
}) => {
  const { projects } = useProjects();
  const { project, config } = useProject();
  const { mutate: mutateFiles } = useFiles();
  const { sources } = useSources();
  const { token } = useGitHub();
  const {
    state: trainingState,
    stopGeneratingEmbeddings,
    trainAllSources,
  } = useTrainingContext();
  const [githubDialogOpen, setGithubDialogOpen] = useState(false);
  const [isFetchingRepoInfo, setFetchingRepoInfo] = useState(false);
  const [numFiles, setNumFiles] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isRepoAccessible, setRepoAcessible] = useState(false);
  const [isTrainingInitiatedByGitHub, setIsTrainingInitiatedByGitHub] =
    useState(false);

  const checkRepo = useCallback(
    async (url: string, config: MarkpromptConfigType) => {
      if (!url || !project) {
        return;
      }

      setFetchingRepoInfo(true);
      setRepoAcessible(false);
      try {
        const files = await getRepositoryMDFilesInfo(
          url,
          config.include || [],
          config.exclude || [],
          token?.access_token || undefined,
        );
        setRepoAcessible(true);
        setNumFiles(files ? files.length : 0);
      } catch (e) {
        setRepoAcessible(false);
        setError(
          `The repository ${getGitHubOwnerRepoString(url)} is not accessible.`,
        );
      }
      setFetchingRepoInfo(false);
    },
    [project, token?.access_token],
  );

  const githubSource = sources.find((s) => s.type === 'github');

  const isReady =
    !!githubSource &&
    (githubSource?.data as GitHubSourceDataType)?.url !== ignoreSource;

  useEffect(() => {
    const data = githubSource?.data as GitHubSourceDataType;
    if (!data?.url) {
      return;
    }
    checkRepo(data.url, config);
  }, [githubSource, config, checkRepo]);

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 p-8 text-sm text-neutral-300 transition duration-300',
        {
          'border-transparent': !isReady || !isRepoAccessible,
          'border-fuchsia-600 bg-fuchsia-500 bg-opacity-[7%]':
            isReady && isRepoAccessible,
        },
      )}
    >
      <div className="relative mt-8 flex w-full max-w-md flex-col gap-4">
        <div className="absolute inset-x-0 -top-12 z-50 overflow-visible">
          <ToggleMessage
            showMessage1={!isReady || !isRepoAccessible}
            message1="Sync files from  GitHub"
            message2={getReadyMessage(
              isFetchingRepoInfo,
              trainingState,
              githubSource,
              numFiles,
              () => {
                setGithubDialogOpen(true);
              },
            )}
          />
        </div>
        <div className="relative flex flex-row justify-center">
          <div className="flex flex-col gap-2">
            <Dialog.Root
              open={githubDialogOpen}
              onOpenChange={setGithubDialogOpen}
            >
              {/* Only hide the trigger if the state is ready. The dialog still needs to be accessible. */}
              {(!isReady || !isRepoAccessible) && (
                <Dialog.Trigger asChild>
                  <Button className="mt-2" variant="plain" Icon={GitHubIcon}>
                    <span className="w-full flex-grow">
                      Select GitHub repository
                    </span>
                  </Button>
                </Dialog.Trigger>
              )}
              <Dialog.Portal>
                <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
                <Dialog.Content className="animate-dialog-slide-in dialog-content flex h-[90%] max-h-[600px] w-[90%] max-w-[500px] flex-col">
                  <Dialog.Title className="dialog-title flex-none">
                    Select GitHub repository
                  </Dialog.Title>
                  <Dialog.Description className="dialog-description flex-none border-b border-neutral-900 pb-4">
                    Sync files from a GitHub repository.
                  </Dialog.Description>
                  <div className="flex-grow">
                    <GitHubSource
                      clearPrevious
                      onDidAddSource={() => {
                        setGithubDialogOpen(false);
                      }}
                    />
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
          {isReady && isRepoAccessible && (
            <Button
              variant="glow"
              loading={
                trainingState.state !== 'idle' && isTrainingInitiatedByGitHub
              }
              loadingMessage="Processing..."
              onClick={async () => {
                const githubUrl = (githubSource?.data as any)['url'];
                if (!projects || !project?.id || !githubUrl) {
                  return;
                }
                try {
                  setError(undefined);
                  setIsTrainingInitiatedByGitHub(true);
                  await trainAllSources(
                    () => {
                      mutateFiles();
                    },
                    (errorMessage: string) => {
                      toast.error(errorMessage);
                    },
                  );
                  onTrainingComplete();
                } catch (e) {
                  setError(`${(e as ApiError).message}`);
                } finally {
                  setIsTrainingInitiatedByGitHub(false);
                }
              }}
            >
              Start training
            </Button>
          )}
        </div>
        {trainingState.state !== 'idle' && isTrainingInitiatedByGitHub && (
          <div className="absolute -bottom-7 flex w-full justify-center">
            <p
              className="subtle-underline cursor-pointer text-xs"
              onClick={stopGeneratingEmbeddings}
            >
              {trainingState.state === 'cancel_requested'
                ? 'Cancelling...'
                : 'Stop training'}
            </p>
          </div>
        )}
      </div>
      {(error || !isRepoAccessible) && (
        <div className="absolute left-4 right-4 bottom-3 flex justify-center">
          <p
            className={cn('text-center text-xs', {
              'text-rose-500': !isRepoAccessible,
              'text-fuchsia-500': isRepoAccessible,
            })}
          >
            {error}
          </p>
        </div>
      )}
    </div>
  );
};
