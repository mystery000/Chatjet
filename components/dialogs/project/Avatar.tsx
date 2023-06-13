import * as Dialog from '@radix-ui/react-dialog';
import { ReactNode, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AvatarFileDnd } from '@/components/files/AvatarFileDnd';


const FilesAddSourceDialog = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [fileDialogOpen, setFileDialogOpen] = useState(false);

  return (
    <Dialog.Root open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
        <Dialog.Content className="animate-dialog-slide-in dialog-content flex h-[90%] max-h-[400px] w-[90%] max-w-[600px] flex-col">
          <div className="flex-grow p-4">
            <AvatarFileDnd
              onUploadingComplete={() => {
                toast.success('uploading complete.', {
                  id: 'uploading-complete',
                });
                setTimeout(async () => {
                  setFileDialogOpen(false);
                }, 1000);
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FilesAddSourceDialog;
