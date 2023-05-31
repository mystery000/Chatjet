import * as Popover from '@radix-ui/react-popover';
import { FC, ReactNode, useState } from 'react';

import {
  CONFIG_DEFAULT_VALUES,
  DEFAULT_MODEL_CONFIG,
} from '@/lib/context/config';
import { defaultTheme } from '@/lib/themes';
import { capitalize, removeFileExtension } from '@/lib/utils';

import { Playground } from '../files/Playground';

type DocsPromptProps = {
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
};

export const DocsPrompt: FC<DocsPromptProps> = ({ children, onOpenChange }) => {
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <Popover.Root
      open={promptOpen}
      onOpenChange={(open) => {
        setPromptOpen(open);
        onOpenChange?.(open);
      }}
    >
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="animate-chat-window z-30 mr-4 mb-4 w-[calc(100vw-32px)] sm:w-full">
          <div className="relative mt-4 h-[calc(100vh-240px)] max-h-[560px] w-full overflow-hidden rounded-lg bg-neutral-1000 shadow-2xl sm:w-[400px]">
            <Playground
              forceUseProdAPI
              inputClassName="pr-8"
              projectKey={
                process.env.NODE_ENV === 'production'
                  ? process.env.NEXT_PUBLIC_MARKPROMPT_WEBSITE_DOCS_PROJECT_KEY
                  : process.env
                      .NEXT_PUBLIC_MARKPROMPT_WEBSITE_DOCS_PROJECT_KEY_TEST
              }
              isDark={true}
              theme={{ ...defaultTheme, dimensions: { radius: '8px' } }}
              placeholder="Ask the Markprompt docs..."
              iDontKnowMessage={CONFIG_DEFAULT_VALUES.iDontKnowMessage}
              referencesHeading={CONFIG_DEFAULT_VALUES.referencesHeading}
              loadingHeading={CONFIG_DEFAULT_VALUES.loadingHeading}
              modelConfig={DEFAULT_MODEL_CONFIG}
              getReferenceInfo={(id) => {
                return {
                  name: capitalize(removeFileExtension(id)),
                  href: `/${removeFileExtension(id)}`,
                };
              }}
              onCloseClick={() => {
                setPromptOpen(false);
                onOpenChange?.(false);
              }}
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
