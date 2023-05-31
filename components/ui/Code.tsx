import { Clipboard } from 'lucide-react';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import { FC } from 'react';
import { toast } from 'react-hot-toast';

import { copyToClipboard } from '@/lib/utils';

type CodeProps = {
  code: string;
  language: Language;
  className?: string;
  noPreWrap?: boolean;
};

export const Code: FC<CodeProps> = ({
  code,
  language,
  noPreWrap,
  className,
}) => {
  return (
    <div className={className}>
      <Highlight {...defaultProps} code={code} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          //  style={style}
          <pre
            className={`${className} ${
              !noPreWrap ? 'whitespace-pre-wrap' : ''
            }`}
          >
            {tokens.map((line, i) => (
              <div key={`code-line-${i}`} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span
                    key={`code-line-${i}-${key}`}
                    {...getTokenProps({ token, key })}
                  />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};

export const CodePanel: FC<CodeProps> = ({
  code,
  language,
  noPreWrap,
  className,
}) => {
  return (
    <div className="not-prose relative w-full rounded-lg border border-neutral-900 bg-neutral-1000 p-4 text-sm">
      <div className="overflow-x-auto">
        <Code
          language={language}
          code={code}
          className={className}
          noPreWrap={noPreWrap}
        />
      </div>
      <div
        className="absolute right-[12px] top-[12px] cursor-pointer rounded bg-neutral-1000/80 p-2 backdrop-blur transition hover:bg-neutral-900"
        onClick={() => {
          copyToClipboard(code);
          toast.success('Copied!');
        }}
      >
        <Clipboard className="h-4 w-4 text-neutral-500" />
      </div>
    </div>
  );
};
