import cn from 'classnames';

import emitter, { EVENT_OPEN_PLAN_PICKER_DIALOG } from '@/lib/events';
import useUsage from '@/lib/hooks/use-usage';

import Button from '../ui/Button';

export const DocsLimit = () => {
  const { numTokensPerTeamRemainingAllowance } = useUsage();

  return (
    <div className="flex flex-row items-center gap-2 p-4">
      <div
        className={cn('flex-grow text-sm text-neutral-300', {
          'text-rose-600':
            numTokensPerTeamRemainingAllowance !== 'unlimited' &&
            numTokensPerTeamRemainingAllowance < 2,
        })}
      >
        Remaining tokens:{' '}
        <span className="font-semibold">
          {numTokensPerTeamRemainingAllowance}
        </span>
      </div>
      <Button
        className="flex-none"
        buttonSize="sm"
        variant="plain"
        onClick={() => {
          emitter.emit(EVENT_OPEN_PLAN_PICKER_DIALOG);
        }}
      >
        Upgrade plan
      </Button>
    </div>
  );
};
