import cn from 'classnames';
import { FC, ReactNode } from 'react';

import { UpgradeCTA } from '../team/PlanPicker';
import Button from '../ui/Button';

type UpgradeNoteProps = {
  showDialog?: boolean;
  className?: string;
  children?: ReactNode;
};

export const UpgradeNote: FC<UpgradeNoteProps> = ({
  showDialog,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        className,
        'flex flex-col gap-4 rounded-md border border-dashed border-fuchsia-500/20 bg-fuchsia-900/20 p-4 text-xs leading-relaxed text-fuchsia-400',
      )}
    >
      {children}
      <div className="flex justify-end">
        <UpgradeCTA showDialog={showDialog}>
          <Button buttonSize="xs" variant="borderedFuchsia" light>
            Upgrade plan
          </Button>
        </UpgradeCTA>
      </div>
    </div>
  );
};
