import cn from 'classnames';
import { FC, ReactNode } from 'react';

import emitter, { EVENT_OPEN_PLAN_PICKER_DIALOG } from '@/lib/events';

import Button from '../ui/Button';

type UpgradeNoteProps = {
  showDialog?: boolean;
  className?: string;
  children?: ReactNode;
};

export const UpgradeNote: FC<UpgradeNoteProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        className,
        'flex flex-col gap-4 rounded-md border border-dashed border-fuchsia-500/20 bg-fuchsia-900/20 p-4 text-xs leading-relaxed text-fuchsia-400',
      )}
    >
      {children}
      <div className="flex justify-end">
        <Button
          buttonSize="xs"
          variant="borderedFuchsia"
          light
          onClick={() => {
            emitter.emit(EVENT_OPEN_PLAN_PICKER_DIALOG);
          }}
        >
          Upgrade plan
        </Button>
      </div>
    </div>
  );
};
