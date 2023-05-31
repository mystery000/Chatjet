import cn from 'classnames';
import Link from 'next/link';
import { FC } from 'react';

import { TrainingState, getTrainingStateMessage } from '@/lib/context/training';
import { pluralize, truncate } from '@/lib/utils';

const getStatusMessage = (
  trainingState: TrainingState,
  isDeleting: boolean,
  numSelected: number,
  numFiles: number,
) => {
  if (trainingState.state === 'idle' && !isDeleting) {
    if (numSelected > 0) {
      return `${pluralize(numSelected, 'file', 'files')} selected`;
    } else {
      return `${pluralize(numFiles, 'file', 'files')} trained`;
    }
  }

  if (trainingState.state === 'loading') {
    return getTrainingStateMessage(trainingState, numFiles);
  } else if (isDeleting) {
    return `Deleting ${pluralize(numSelected, 'file', 'files')}`;
  }
};

type StatusMessageProps = {
  trainingState: TrainingState;
  numFiles: number;
  numSelected: number;
  isDeleting?: boolean;
  playgroundPath?: string;
};

const StatusMessage: FC<StatusMessageProps> = ({
  trainingState,
  numFiles,
  numSelected,
  isDeleting,
  playgroundPath,
}) => {
  return (
    <div
      className={cn(
        'flex w-full flex-row items-center justify-center whitespace-nowrap text-xs',
        {
          'text-neutral-500': trainingState.state !== 'loading',
          'text-sky-500': trainingState.state === 'loading',
        },
      )}
    >
      <p
        className={cn('truncate text-center', {
          'animate-pulse': trainingState.state === 'loading',
        })}
      >
        {getStatusMessage(trainingState, !!isDeleting, numSelected, numFiles)}
      </p>
      {playgroundPath &&
        trainingState.state === 'idle' &&
        numSelected === 0 &&
        numFiles > 0 && (
          <Link href={playgroundPath}>
            <span className="subtle-underline ml-3 whitespace-nowrap transition hover:text-neutral-300">
              Query in playground
            </span>
          </Link>
        )}
    </div>
  );
};

export default StatusMessage;
