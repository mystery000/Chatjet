import { createClient } from '@supabase/supabase-js';
import cn from 'classnames';
import { Moon } from 'lucide-react';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { FC } from 'react';

import { Playground } from '@/components/files/Playground';
import { SharedHead } from '@/components/pages/SharedHead';
import { useLocalStorage } from '@/lib/hooks/utils/use-localstorage';
import { Theme } from '@/lib/themes';
import { getNameFromPath, removeFileExtension } from '@/lib/utils';
import { Database } from '@/types/supabase';
import { ModelConfig } from '@/types/types';

type PromptConfig = {
  theme: Theme;
  placeholder: string;
  modelConfig: ModelConfig;
  iDontKnowMessage: string;
  referencesHeading: string;
  loadingHeading: string;
  includeBranding: boolean;
};

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const shareKey = params?.key;

  const { data, error } = await supabaseAdmin
    .from('prompt_configs')
    .select('project_id,config,projects(public_api_key)')
    .eq('share_key', shareKey)
    .limit(1)
    .maybeSingle();

  const projectKey = (data?.projects as any)?.public_api_key;

  if (error || !data?.config || !projectKey) {
    throw new Error('Failed to fetch config');
  }

  const config = data.config as any;

  const promptConfig: PromptConfig = {
    theme: config.theme,
    placeholder: config.placeholder,
    modelConfig: config.modelConfig,
    iDontKnowMessage: config.iDontKnowMessage,
    referencesHeading: config.referencesHeading,
    loadingHeading: config.loadingHeading,
    includeBranding: config.includeBranding,
  };

  return {
    props: {
      projectKey,
      promptConfig,
    },
    revalidate: 10,
  };
};

const SharePage: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({
  projectKey,
  promptConfig,
}) => {
  const [isDark, setDark] = useLocalStorage<boolean>(
    `public:share:isDark`,
    true,
  );

  if (!promptConfig) {
    return <></>;
  }

  return (
    <>
      <SharedHead title="Playground | Markprompt" />
      <div
        className={cn('grid-background relative h-screen w-screen', {
          'grid-background-dark bg-neutral-900': isDark,
          'grid-background-light bg-neutral-100': !isDark,
        })}
      >
        <div className="absolute top-4 right-4 z-20">
          <div
            className={cn('cursor-pointer rounded p-2 transition', {
              'text-neutral-300 hover:bg-white/5': isDark,
              'text-neutral-900 hover:bg-black/5': !isDark,
            })}
            onClick={() => {
              setDark(!isDark);
            }}
          >
            <Moon className="h-5 w-5" />
          </div>
        </div>
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="h-[calc(100vh-120px)] max-h-[900px] w-[80%] max-w-[700px]">
            <Playground
              projectKey={projectKey}
              iDontKnowMessage={promptConfig.iDontKnowMessage}
              theme={promptConfig.theme}
              placeholder={promptConfig.placeholder}
              isDark={isDark}
              modelConfig={promptConfig.modelConfig}
              referencesHeading={promptConfig.referencesHeading}
              loadingHeading={promptConfig.loadingHeading}
              includeBranding={true}
              hideCloseButton
              getReferenceInfo={(path: string) => {
                const name = removeFileExtension(getNameFromPath(path));
                return { name };
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SharePage;
