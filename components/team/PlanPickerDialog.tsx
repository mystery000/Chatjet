import * as Dialog from '@radix-ui/react-dialog';
import { FC, ReactNode, useEffect, useState } from 'react';

import emitter, { EVENT_OPEN_PLAN_PICKER_DIALOG } from '@/lib/events';

import PlanPicker from './PlanPicker';

type PlanPickerDialogProps = {
  children?: ReactNode;
};

const PlanPickerDialog: FC<PlanPickerDialogProps> = ({ children }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setDialogOpen(true);
    };

    emitter.on(EVENT_OPEN_PLAN_PICKER_DIALOG, handler);

    return () => {
      emitter.off(EVENT_OPEN_PLAN_PICKER_DIALOG, handler);
    };
  }, []);

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={setDialogOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
        <Dialog.Content className="animate-dialog-slide-in dialog-content max-h-[90%] w-[90%] max-w-[1200px] overflow-y-auto py-12 px-12">
          <h1 className="mb-8 text-center text-xl font-bold text-neutral-100">
            Choose plan
          </h1>
          <PlanPicker />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PlanPickerDialog;
