import cn from 'classnames';
import { FC, useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import { addSource, deleteSource } from '@/lib/api';
import {
  getTrainingStateMessage,
  useTrainingContext,
} from '@/lib/context/training';
import useFiles from '@/lib/hooks/use-files';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';

import Button from '../ui/Button';

type GitHubSampleProps = {
  repoUrl: string;
  onTrainingComplete: () => void;
  className?: string;
};

export const GitHubSample: FC<GitHubSampleProps> = ({
  repoUrl,
  onTrainingComplete,
}) => {
  const { project } = useProject();
  const { mutate: mutateFiles } = useFiles();
  const { sources, mutate: mutateSource } = useSources();
  const {
    state: trainingState,
    stopGeneratingEmbeddings,
    trainSource,
  } = useTrainingContext();
  const [error, setError] = useState<string | undefined>(undefined);
  const [isTraining, setIsTraining] = useState(false);

  const startTraining = useCallback(async () => {
    if (!project?.id) {
      return;
    }
    try {
      setIsTraining(true);
      setError(undefined);
      for (const source of sources) {
        await deleteSource(project.id, source.id);
      }
      const newSource = await addSource(project.id, 'github', { url: repoUrl });

      await mutateSource();
      await trainSource(
        newSource,
        () => {
          mutateFiles();
        },
        (message: string) => {
          toast.error(message);
        },
      );
      setIsTraining(false);
      onTrainingComplete();
    } catch (e) {
      console.error(e);
      toast.error(`${e}`);
    }
  }, [
    project?.id,
    repoUrl,
    mutateSource,
    trainSource,
    onTrainingComplete,
    mutateFiles,
    sources,
  ]);

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 p-8 text-sm text-neutral-300 transition duration-300',
        {
          'border-transparent': !isTraining,
          'border-fuchsia-600 bg-fuchsia-500 bg-opacity-[7%]': isTraining,
        },
      )}
    >
      <div className="relative flex w-full max-w-md flex-col gap-4">
        <div className="absolute inset-x-0 z-50 overflow-visible">
          {isTraining && (
            <div className="relative -top-8 flex items-center justify-center">
              {getTrainingStateMessage(trainingState)}
            </div>
          )}
        </div>
        <div className="relative flex flex-row justify-center">
          <div className="flex flex-col gap-2">
            <Button
              variant={isTraining ? 'glow' : 'plain'}
              loading={isTraining}
              onClick={startTraining}
              loadingMessage="Processing..."
            >
              Import sample project
            </Button>
          </div>
        </div>
        {isTraining && (
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
      {error && (
        <div className="absolute left-4 right-4 bottom-3 flex justify-center">
          <p className={cn('text-center text-xs text-fuchsia-500')}>{error}</p>
        </div>
      )}
    </div>
  );
};
