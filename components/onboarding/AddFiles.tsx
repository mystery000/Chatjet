import cn from 'classnames';
import { Clipboard, Info } from 'lucide-react';
import { FC, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

import { FileDnd } from '@/components/files/FileDnd';
import { Code } from '@/components/ui/Code';
import { SAMPLE_REPO_URL } from '@/lib/constants';
import useFiles from '@/lib/hooks/use-files';
import useTokens from '@/lib/hooks/use-tokens';
import { copyToClipboard, pluralize } from '@/lib/utils';
import { getAppHost } from '@/lib/utils.edge';

import { GitHubSample } from './GitHubSample';
import { GitHub } from '../files/GitHub';

type TagProps = {
  children: ReactNode;
  className?: string;
  variant?: 'fuchsia' | 'sky';
};

const Tag: FC<TagProps> = ({ className, variant, children }) => {
  return (
    <span
      className={cn(
        className,
        'rounded-full px-1.5 py-0.5 text-xs font-medium',
        {
          'bg-fuchsia-900/30 text-fuchsia-500': variant === 'fuchsia',
          'bg-sky-500/10 text-sky-500': variant === 'sky',
        },
      )}
    >
      {children}
    </span>
  );
};

type AddFilesProps = {
  onTrainingComplete: () => void;
  onNext: () => void;
};

const AddFiles: FC<AddFilesProps> = ({ onTrainingComplete, onNext }) => {
  const { files } = useFiles();
  const { tokens } = useTokens();

  const curlCode = `
  curl https://api.${getAppHost()}/v1/train \\
  --data-binary @content.zip \\
    -H "Content-Type: application/zip" \\
    -H "Authorization: Bearer ${tokens?.[0]?.value || '<TOKEN>'}"
  `.trim();

  return (
    <div className="pt-12 pb-16">
      <div className="mx-auto flex w-full max-w-screen-sm flex-col items-center justify-center gap-2 p-8 pt-20 text-neutral-300">
        <p className="font-medium">Step 1: Train content</p>
        <p className="mt-1 text-sm text-neutral-500">
          Accepted: <Tag variant="fuchsia">.md</Tag>
          <Tag variant="fuchsia" className="ml-1.5">
            .mdoc
          </Tag>
          <Tag variant="fuchsia" className="ml-1.5">
            .mdx
          </Tag>
          <Tag variant="fuchsia" className="ml-1.5">
            .html
          </Tag>
          <Tag variant="fuchsia" className="ml-1.5">
            .txt
          </Tag>
        </p>
        <div className="mt-4 flex w-full flex-col items-center gap-3">
          <div className="h-[160px] w-full rounded-lg border border-dashed border-neutral-800 bg-neutral-900/50">
            <GitHub
              onTrainingComplete={onTrainingComplete}
              ignoreSource={SAMPLE_REPO_URL}
            />
          </div>
          <p className="text-sm text-neutral-400">or</p>
          <div className="h-[140px] w-full rounded-lg border border-dashed border-neutral-800 bg-neutral-900/50">
            <GitHubSample
              repoUrl={SAMPLE_REPO_URL}
              onTrainingComplete={onTrainingComplete}
            />
          </div>
          <p className="text-sm text-neutral-400">or</p>
          <div className="h-[160px] w-full rounded-lg border border-dashed border-neutral-800 bg-neutral-900/50">
            <FileDnd onTrainingComplete={onTrainingComplete} />
          </div>
          <p className="text-sm text-neutral-400">or</p>
          <div className="relative w-full rounded-lg border border-dashed border-neutral-800 bg-neutral-900/50 py-4">
            <div
              className="absolute right-2 top-2 cursor-pointer rounded p-2 transition hover:bg-neutral-900"
              onClick={() => {
                copyToClipboard(curlCode);
                toast.success('Copied!');
              }}
            >
              <Clipboard className="h-4 w-4 text-neutral-500" />
            </div>
            <div className="hidden-scrollbar w-full overflow-x-auto px-4">
              <Code
                className="hidden-scrollbar mx-auto w-[540px] overflow-x-auto py-2 text-sm"
                language="bash"
                code={curlCode}
              />
            </div>
          </div>
          <p
            className={cn(
              'mt-4 transform cursor-pointer text-center text-sm text-sky-600 transition duration-500 hover:text-sky-400',
              {
                'translate-y-2 opacity-0': files?.length === 0,
                'translate-y-0 opacity-100': !files || files.length > 0,
              },
            )}
            onClick={() => onNext()}
          >
            {pluralize(files?.length || 0, 'file', 'files')} ready. Go to
            playground →
          </p>
          <div
            className={cn(
              '-mt-8 flex transform cursor-pointer flex-row items-center justify-center gap-2 text-center  text-sm text-neutral-600 transition duration-500 hover:text-neutral-400',
              {
                'translate-y-0': files?.length === 0,
                'translate-y-8': !files || files.length > 0,
              },
            )}
          >
            <Info className="h-4 w-4" />
            <a
              className="subtle-underline"
              target="_blank"
              rel="noreferrer"
              href="https://markprompt.com/docs#data-retention"
            >
              How is my data stored?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFiles;
