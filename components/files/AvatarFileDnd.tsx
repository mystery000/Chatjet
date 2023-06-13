import { useSupabaseClient } from '@supabase/auth-helpers-react';
import cn from 'classnames';
import { FC, useCallback, useEffect, useState } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import useProject from '@/lib/hooks/use-project';
import { AVATAR_SUPPORTED_EXTENSIONS } from '@/lib/utils';
import Button from '../ui/Button';
import { ToggleMessage } from '../ui/ToggleMessage';
import { updateProject } from '@/lib/api';
type AvatarDndProps = {
  isOnEmptyStateDataPanel?: boolean;
  onUploadingComplete: () => void;
  className?: string;
};

export const AvatarFileDnd: FC<AvatarDndProps> = ({
  isOnEmptyStateDataPanel,
  onUploadingComplete,
}) => {
  const supabase = useSupabaseClient();
  const [pickedFile, setPickedFile] = useState<FileWithPath | null>();
  const [uploadingComplete, setUploadingComplete] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { project, mutate: mutateProject } = useProject();
  const { getRootProps, getInputProps, open, acceptedFiles } = useDropzone({
    disabled: uploading,
    noClick: true,
    noKeyboard: true,
    maxFiles: 1,
    multiple: false,
    maxSize: 1_000_000,
    accept: { 'image/*': ['.png', '.jpeg', '.jpg', '.ico', '.bmp'] },
    onDragEnter: () => {
      setDragging(true);
    },
    onDragLeave: () => {
      setDragging(false);
    },
    onDrop: () => {
      setDragging(false);
    },
  });

  useEffect(() => {
    if (acceptedFiles?.length > 0) {
      Promise.all(
        acceptedFiles.map(async (file) => {
          return file;
        }),
      ).then((files) => setPickedFile(files[0]));
    }
  }, [acceptedFiles]);

  const upload = useCallback(async () => {
    setUploading(true)
    if (!project?.id) {
      return;
    }
    if (!pickedFile) {
      toast.error('No files selected');
      return;
    }
    mutateProject(
      updateProject(`${project?.id}`, {
        avatar: URL.createObjectURL(pickedFile),
      }),
    );
    setUploading(false)
    setUploadingComplete(true)
    onUploadingComplete()
  }, [supabase, pickedFile, project?.id]);

  const hasFiles = pickedFile;

  return (
    <div
      className={cn(
        'relative h-full w-full rounded-lg border-2 text-sm text-neutral-300 transition duration-300',
        {
          'border-fuchsia-600 bg-fuchsia-500 bg-opacity-[3%]': dragging,
          'border-transparent': !dragging && !hasFiles,
          'border-fuchsia-600 bg-fuchsia-500 bg-opacity-[7%]': hasFiles,
        },
      )}
    >
      <div
        className="flex h-full w-full items-center justify-center"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <div className="flex h-full w-full flex-row items-center justify-center gap-2">
          <div className="relative mt-4 w-full">
            <div className="absolute inset-x-0 top-[-60px]">
              <ToggleMessage
                showMessage1={!hasFiles}
                message1={
                  <>
                    {uploadingComplete ? (
                      'Processing complete'
                    ) : (
                      <>
                        Drop your avatar here
                        {isOnEmptyStateDataPanel ? ', or connect a source' : ''}
                      </>
                    )}
                    <p
                      className={cn(
                        'mt-1 text-center text-xs text-neutral-500',
                        {
                          'opacity-0': uploadingComplete,
                        },
                      )}
                    >
                      A folder also works. Max image size: 1 MB.
                    </p>
                    <p
                      className={cn('text-center text-xs text-neutral-500', {
                        'opacity-0': uploadingComplete,
                      })}
                    >
                      Supported image extensions:{' '}
                      {AVATAR_SUPPORTED_EXTENSIONS.join(', ')}.
                    </p>
                  </>
                }
                message2={
                  <>
                    {pickedFile && (
                      <div className="mb-16 flex items-center justify-center">
                        <img
                          src={`${URL.createObjectURL(pickedFile)}`}
                          alt="No Avatar"
                          className="h-36 w-36 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </>
                }
              />
            </div>
            <Button
              className="mx-auto mt-5 min-w-[140px]"
              variant={hasFiles ? 'glow' : 'plain'}
              onClick={hasFiles ? upload : open}
              // Only show loading message if the training was initiated
              // here (as opposed to e.g. via the GitHub component).
              loading={uploading}
              loadingMessage="Uploading..."
            >
              {hasFiles ? 'UPLOAD' : 'Select avatar'}
            </Button>
          </div>
        </div>
      </div>

      {!uploading && (
        <p
          className={cn(
            'absolute inset-x-0 bottom-3 transform text-center text-xs text-neutral-400 transition duration-300',
            {
              'pointer-events-none opacity-50': uploading,
              'translate-y-1 opacity-0': !pickedFile,
              'translate-y-0 opacity-100': pickedFile,
            },
          )}
        >
          <span
            className="subtle-underline cursor-pointer transition hover:opacity-80"
            onClick={open}
          >
            Select new
          </span>{' '}
          or{' '}
          <span
            className="subtle-underline cursor-pointer transition hover:opacity-80"
            onClick={() => setPickedFile(null)}
          >
            clear images
          </span>
        </p>
      )}
    </div>
  );
};
