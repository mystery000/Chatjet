import * as Dialog from '@radix-ui/react-dialog';
import cn from 'classnames';
import { Link, RefreshCw } from 'lucide-react';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import Button from '@/components/ui/Button';
import { CTABar } from '@/components/ui/SettingsCard';
import { createPromptConfig, deletePromptConfig } from '@/lib/api';
import { useConfigContext } from '@/lib/context/config';
import useProject from '@/lib/hooks/use-project';
import usePromptConfigs from '@/lib/hooks/use-prompt-configs';
import useTeam from '@/lib/hooks/use-team';
import { copyToClipboard, generateShareKey } from '@/lib/utils';
import { getAppOrigin, removeSchema } from '@/lib/utils.edge';

const getShareLink = (shareKey: string) => {
  return `${getAppOrigin()}/s/${shareKey}`;
};

const Share = ({ children }: { children: ReactNode }) => {
  const { team } = useTeam();
  const { project } = useProject();
  const { promptConfigs, mutate: mutatePromptConfigs } = usePromptConfigs();
  const [isGeneratingKey, setGeneratingKey] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const {
    theme,
    placeholder,
    modelConfig,
    iDontKnowMessage,
    referencesHeading,
    loadingHeading,
    includeBranding,
  } = useConfigContext();
  const promptConfig = promptConfigs?.[0];
  const shareKey = promptConfig?.share_key;

  const generateAndStoreShareKey = useCallback(
    async (shareKey: string | null) => {
      if (!project) {
        return;
      }

      setGeneratingKey(true);

      if (promptConfig) {
        await deletePromptConfig(project.id, promptConfig.id);
      }

      if (shareKey) {
        await createPromptConfig(project.id, shareKey, {
          theme,
          placeholder,
          modelConfig,
          iDontKnowMessage,
          referencesHeading,
          loadingHeading,
          includeBranding,
        });
      }
      await mutatePromptConfigs();
      setGeneratingKey(false);
    },
    [
      iDontKnowMessage,
      includeBranding,
      loadingHeading,
      modelConfig,
      mutatePromptConfigs,
      placeholder,
      project,
      promptConfig,
      referencesHeading,
      theme,
    ],
  );

  useEffect(() => {
    if (!shareDialogOpen) {
      return;
    }
    if (!shareKey) {
      generateAndStoreShareKey(generateShareKey());
    }
  }, [shareKey, generateAndStoreShareKey, shareDialogOpen]);

  if (!team || !project) {
    return <></>;
  }

  return (
    <Dialog.Root open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
        <Dialog.Content
          className="animate-dialog-slide-in dialog-content flex max-h-[90%] w-[90%] max-w-[500px] flex-col"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <Dialog.Title className="dialog-title-xl flex flex-none flex-row items-center gap-2">
            <div className="flex-grow truncate">Share prompt</div>
          </Dialog.Title>
          <Dialog.Description className="dialog-description-xl mt-2 flex-none border-b border-neutral-900 pb-4">
            Share your prompt publicly and let others try it out.
          </Dialog.Description>
          <div className="flex h-full w-full flex-grow p-6">
            <div className="group flex w-full flex-row items-center gap-2 rounded-md py-1">
              <div
                className="flex-none cursor-pointer rounded-md p-1 text-neutral-300 transition hover:bg-neutral-800"
                onClick={() => {
                  if (!shareKey) {
                    return;
                  }
                  copyToClipboard(getShareLink(shareKey));
                  toast.success('Share URL copied to clipboard.');
                }}
              >
                <Link className="h-4 w-4 text-neutral-500" />
              </div>
              <a
                className={cn(
                  'block select-none truncate py-0.5 font-mono text-sm text-neutral-300 transition',
                  {
                    'pointer-event-none opacity-50': isGeneratingKey,
                    underline: shareKey && !isGeneratingKey,
                  },
                )}
                href={shareKey ? getShareLink(shareKey) : undefined}
                target="_blank"
                rel="noreferrer"
              >
                {!shareKey || isGeneratingKey
                  ? 'Generating key...'
                  : removeSchema(getShareLink(shareKey))}
              </a>
              <div className="flex-grow" />
              <div
                className={cn(
                  'flex-none cursor-pointer rounded-md p-1 text-neutral-300 transition',
                  {
                    'animate-spin': isGeneratingKey,
                    ' hover:bg-neutral-800': !isGeneratingKey,
                  },
                )}
                onClick={() => {
                  generateAndStoreShareKey(generateShareKey());
                }}
              >
                <RefreshCw className="h-4 w-4 text-neutral-500" />
              </div>
            </div>
          </div>
          <CTABar>
            <Button
              loading={isGeneratingKey}
              variant="ghost"
              onClick={() => {
                generateAndStoreShareKey(null);
                setShareDialogOpen(false);
                toast.success('Prompt sharing has been disabled.');
              }}
              buttonSize="sm"
            >
              Stop sharing
            </Button>
          </CTABar>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Share;
