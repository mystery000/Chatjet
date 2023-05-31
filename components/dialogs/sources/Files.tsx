import * as Dialog from '@radix-ui/react-dialog';
import { ReactNode, useState } from 'react';
import { toast } from 'react-hot-toast';

import { FileDnd } from '@/components/files/FileDnd';

const FilesAddSourceDialog = ({
  onDidAddSource,
  children,
}: {
  onDidAddSource?: () => void;
  children: ReactNode;
}) => {
  const [fileDialogOpen, setFileDialogOpen] = useState(false);

  return (
    <Dialog.Root open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
        <Dialog.Content className="animate-dialog-slide-in dialog-content h-[90%] max-h-[400px] w-[90%] max-w-[600px]">
          <FileDnd
            onTrainingComplete={() => {
              toast.success('Processing complete.');
              setTimeout(async () => {
                setFileDialogOpen(false);
                onDidAddSource?.();
              }, 1000);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FilesAddSourceDialog;
