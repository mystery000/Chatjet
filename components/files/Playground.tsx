import cn from 'classnames';
import { X, Baby, SendIcon, RefreshCw } from 'lucide-react';
import {
  FC,
  ForwardedRef,
  ReactNode,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { I_DONT_KNOW, STREAM_SEPARATOR } from '@/lib/constants';
import { Theme } from '@/lib/themes';
import { timeout } from '@/lib/utils';
import { getAppOrigin } from '@/lib/utils.edge';
import { ModelConfig, ReferenceInfo } from '@/types/types';
import { NoAutoInput } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import useMessages from '@/lib/hooks/use-messages';

type CaretProps = {
  color?: string;
  className?: string;
};

const Caret: FC<CaretProps> = ({ color, className }) => {
  return (
    <i
      className={cn(
        className,
        'caret animate-caret inline-block h-[15px] w-[8px] translate-y-[2px] translate-x-[2px] transform rounded-[1px]',
      )}
      style={{
        backgroundColor: color,
        boxShadow: `0 0px 3px 0 ${color}bb`,
      }}
    />
  );
};

type WithCaretProps = {
  Component: string;
  caretColor?: string;
  children?: ReactNode;
} & any;

const WithCaret: FC<WithCaretProps> = ({
  Component,
  caretColor,
  children,
  ...rest
}) => {
  // Sometimes, react-markdown sends props of incorrect type,
  // causing React errors. To be safe, we normalize them here.
  // const stringifiedProps = Object.keys(rest).reduce((acc, key) => {
  //   const value = rest[key];
  //   if (value === null || typeof value === 'undefined') {
  //     return acc;
  //   }
  //   return {
  //     ...acc,
  //     [key]: typeof value !== 'string' ? value.toString() : value,
  //   };
  // }, {});

  return (
    <Component
      // {...stringifiedProps}
      {...rest}
      className="markdown-node"
    >
      {children}
      <Caret color={caretColor} />
    </Component>
  );
};

type PlaygroundProps = {
  projectKey?: string;
  forceUseProdAPI?: boolean;
  onStateChanged?: (loading: boolean) => void;
  didCompleteFirstQuery?: () => void;
  onCloseClick?: () => void;
  onDark?: boolean;
  autoScrollDisabled?: boolean;
  isDemoMode?: boolean;
  playing?: boolean;
  demoPrompt?: string;
  demoResponse?: string;
  demoReferenceIds?: string[];
  noAnimation?: boolean;
  iDontKnowMessage?: string;
  modelConfig?: ModelConfig;
  placeholder?: string;
  referencesHeading?: string;
  loadingHeading?: string;
  inputClassName?: string;
  theme?: Theme;
  isDark?: boolean;
  includeBranding?: boolean;
  hideCloseButton?: boolean;
  getReferenceInfo?: (refId: string) => ReferenceInfo | undefined;
};

// The playground is used in three scenarios:
// - In demo mode for the landing page - it's not referring to any project
// - In the dashboard, to try out a model. It's using the current active project
// - In the docs, where it's referring to an external docs project on Markprompt
export const Playground = forwardRef(
  (
    {
      projectKey,
      forceUseProdAPI,
      onStateChanged,
      didCompleteFirstQuery,
      onCloseClick,
      autoScrollDisabled,
      isDemoMode,
      playing,
      demoPrompt,
      demoResponse,
      demoReferenceIds,
      noAnimation,
      iDontKnowMessage,
      modelConfig,
      placeholder,
      referencesHeading,
      loadingHeading,
      inputClassName,
      theme,
      isDark,
      includeBranding,
      hideCloseButton,
      getReferenceInfo,
    }: PlaygroundProps,
    forwardedRef: ForwardedRef<HTMLDivElement>,
  ) => {
    const [prompt, setPrompt] = useState<string | undefined>('');
    const [answer, setAnswer] = useState('');
    const [references, setReferences] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const answerContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const _didCompleteFirstQuery = useRef<boolean>(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const _iDontKnowMessage = iDontKnowMessage || I_DONT_KNOW;
    const colors = isDark ? theme?.colors.dark : theme?.colors.light;
    const {
      messages,
      mutate: mutateMessages,
      loading: loadingMessages,
    } = useMessages();

    useEffect(() => {
      if (!playing || !demoResponse || !demoPrompt) {
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        if (!noAnimation) {
          inputRef.current?.focus();
        }
        const promptChunks = demoPrompt.split('');
        if (!noAnimation) {
          await timeout(500);
        }
        for (const prompt of promptChunks) {
          setPrompt((p) => (p ? p : '') + prompt);
          if (!noAnimation) {
            await timeout(Math.random() * 10 + 30);
          }
        }

        if (!noAnimation) {
          await timeout(500);
        }
        setLoading(true);
        if (!noAnimation) {
          await timeout(2000);
        }
        const responseChunks = demoResponse.split(' ');
        setReferences(demoReferenceIds || []);
        for (const chunk of responseChunks) {
          setAnswer((a) => a + chunk + ' ');
          if (!noAnimation) {
            await timeout(Math.random() * 10 + 70);
          }
        }
        setLoading(false);
        await timeout(500);
      }, 200);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [playing, demoResponse, demoPrompt, demoReferenceIds, noAnimation]);

    useEffect(() => {
      onStateChanged?.(!!loading);
    }, [loading, onStateChanged]);

    const setAnswerAnimated = useCallback(async (answer: string) => {
      const responseChunks = answer.split(' ');
      for (const chunk of responseChunks) {
        setAnswer((a) => a + chunk + ' ');
        await timeout(Math.random() * 10 + 70);
      }
    }, []);

    const submitPrompt = useCallback(
      async (e: SyntheticEvent<EventTarget>) => {
        e.preventDefault();

        if (!prompt || isDemoMode) {
          return;
        }

        if (!projectKey) {
          return;
        }
        const question = prompt;
        setPrompt('');
        setAnswer('');
        setReferences([]);
        setLoading(true);

        try {
          const res = await fetch(
            `${getAppOrigin('api', !!forceUseProdAPI)}/v1/completions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: question,
                iDontKnowMessage: _iDontKnowMessage,
                ...modelConfig,
                projectKey,
                includeDebugInfo: true,
              }),
            },
          );
          if (!res.ok || !res.body) {
            const text = await res.text();
            console.error(text);
            await setAnswerAnimated(_iDontKnowMessage);
            setLoading(false);
            toast.error(text);
            return;
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let startText = '';
          let didHandleHeader = false;
          let refs: string[] = [];

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            if (!didHandleHeader) {
              startText = startText + chunkValue;
              if (startText.includes(STREAM_SEPARATOR)) {
                const parts = startText.split(STREAM_SEPARATOR);
                try {
                  refs = JSON.parse(parts[0]);
                  setReferences(refs);
                } catch {
                  // do nothing
                }
                setAnswer((prev) => prev + parts[1]);
                didHandleHeader = true;
              }
            } else {
              setAnswer((prev) => prev + chunkValue);
            }
          }
        } catch (e) {
          console.error('Error', e);
          await setAnswerAnimated(_iDontKnowMessage);
        }
        setLoading(false);
      },
      [
        prompt,
        isDemoMode,
        projectKey,
        forceUseProdAPI,
        _iDontKnowMessage,
        modelConfig,
        setAnswerAnimated,
      ],
    );

    useEffect(() => {
      if (
        autoScrollDisabled ||
        !containerRef.current ||
        !answerContainerRef.current
      ) {
        return;
      }
      const childRect = answerContainerRef.current.getBoundingClientRect();
      containerRef.current.scrollTop = childRect.bottom;
    }, [answer, loading, autoScrollDisabled, references]);

    useEffect(() => {
      if (!loading && answer.length > 0) {
        // This gets called after an answer has completed.
        if (!_didCompleteFirstQuery.current) {
          _didCompleteFirstQuery.current = true;
          didCompleteFirstQuery?.();
        }
      }
    }, [loading, answer, didCompleteFirstQuery]);

    const showProgress = loading && (!references || references.length === 0);

    return (
      <div
        ref={forwardedRef}
        className={cn('relative flex h-full flex-col overflow-hidden border', {
          'light-playground': !isDark,
        })}
        style={{
          backgroundColor: colors?.background,
          borderColor: colors?.border,
          borderRadius: theme?.dimensions.radius,
        }}
      >
        <div
          className="relative mx-4 flex flex-none flex-row items-center justify-between gap-2 border-b py-2"
          style={{
            borderColor: colors?.border,
          }}
        >
          <div className="flex flex-row items-center gap-2 text-black/90">
            <img src="/static/favicons/favicon.ico" className="h-8 w-8" />
            <div className="font-bold">Chatbase</div>
          </div>
          <div className="flex-none cursor-pointer rounded p-1 transition hover:opacity-60" title='Refresh'>
            <RefreshCw className="text-gray-500" size={20} />
          </div>
        </div>
        <div
          ref={containerRef}
          className={cn(
            'hidden-scrollbar prompt-answer prose z-0 flex max-w-full flex-grow flex-col overflow-y-auto scroll-smooth px-8 py-4',
            {
              'prompt-answer-done': !loading,
              'prompt-answer-loading': loading,
              'prose-sm': theme?.size === 'sm',
            },
          )}
          style={{
            color: colors?.foreground,
          }}
        >
          {loading && !(answer.length > 0) && (
            <Caret className="mt-4" color={colors?.primary} />
          )}
          {/* Need a container for ReactMarkdown to be able to access
            :last-child and display the caret */}
          <div className="flex w-full flex-1 justify-center overflow-auto">
            <div className="w-full max-w-3xl">
              {messages.map((message) => (
                <>
                  <div
                    key={message.id}
                    className="flex w-full flex-row justify-end p-1"
                  >
                    <div className="flex flex-row items-start">
                      <div className="order-2 flex w-fit grow flex-col rounded-lg  rounded-tr-lg border bg-gray-300 px-3 py-1 text-black shadow-sm shadow-slate-200 lg:max-w-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.prompt || ''}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  <div
                    key={message.id}
                    className="flex w-full flex-row justify-start p-1"
                  >
                    <div className="flex flex-row items-start">
                      <div className="order-1 flex w-fit grow flex-col rounded-lg  rounded-tr-lg border bg-black/80 px-3 py-1 text-white shadow-sm shadow-slate-200 lg:max-w-lg">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.response || ''}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </>
              ))}
              <div ref={answerContainerRef} />
            </div>
          </div>
        </div>
        {(loading || references.length > 0) && (
          <>
            <div
              className="animate-slide-up relative flex-none transform border-t pt-4 text-sm text-neutral-500"
              style={{
                borderColor: colors?.border,
                backgroundColor: colors?.secondary,
                height:
                  (theme?.size === 'sm' ? 1 : 1.05) * (showProgress ? 50 : 95),
                transition: 'height 500ms ease',
              }}
            >
              {showProgress && (
                <div
                  className={`animate-progress absolute left-0 top-[-2px] h-[2px]`}
                  style={{
                    backgroundImage: `linear-gradient(to right,${colors?.primaryHighlight},${colors?.secondaryHighlight})`,
                  }}
                />
              )}
              <div
                className={cn('px-8 font-semibold', {
                  'text-xs': theme?.size === 'sm',
                  'text-sm': theme?.size === 'base',
                })}
                style={{ color: colors?.foreground }}
              >
                <div className="relative">
                  <span
                    className={cn('transition', {
                      'opacity-0': showProgress,
                      'opacity-100': !showProgress,
                    })}
                  >
                    {referencesHeading}
                  </span>
                  <span
                    className={cn('absolute inset-0 transition', {
                      'opacity-0': !showProgress,
                      'opacity-100': showProgress,
                    })}
                  >
                    {loadingHeading}
                  </span>
                </div>
              </div>
              {/* Bottom padding is here, to prevent clipping items when then are animated up */}
              <div className="hidden-scrollbar mt-1 flex w-full flex-row items-center gap-2 overflow-x-auto overflow-y-visible px-8 pt-2 pb-8">
                {(references || []).map((r, i) => {
                  const refInfo = getReferenceInfo?.(r);
                  if (!refInfo) {
                    return <></>;
                  }

                  return (
                    <a
                      key={`reference-${r}`}
                      className={cn(
                        'button-ring animate-slide-up inline-block max-w-[30%] shrink-0 truncate whitespace-nowrap rounded-md border px-2 py-1 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/50',
                        {
                          'button-ring-light': !isDark,
                        },
                      )}
                      href={refInfo.href}
                      style={{
                        borderColor: colors?.border,
                        backgroundColor: colors?.muted,
                        color: colors?.primary,
                        animationDelay: `${100 * i}ms`,
                      }}
                    >
                      {refInfo.name}
                    </a>
                  );
                })}
              </div>
            </div>
          </>
        )}
        <div
          className="relative flex flex-none flex-row items-center gap-2 py-1 px-4"
          style={{
            borderColor: colors?.border,
          }}
        >
          <div className="flex-grow">
            <form onSubmit={submitPrompt}>
              <div className="flex flex-none flex-row">
                <NoAutoInput
                  ref={inputRef}
                  value={prompt || ''}
                  type="text"
                  onChange={(e: any) => setPrompt(e.target.value)}
                  placeholder={placeholder}
                  className={`grow !text-black text-[${colors?.foreground}] caret-[${colors?.foreground}] !focus:ring-sky-300 !rounded-none !rounded-l-md !border-gray-300 !bg-gray-100`}
                />
                <Button
                  className="flex-none rounded-none rounded-r-md text-center"
                  disabled={loading}
                  loading={loading}
                  variant="plain"
                  buttonSize="xs"
                  type="submit"
                >
                  <SendIcon className="mr-1 rotate-45" size={20} />
                </Button>
              </div>
            </form>
          </div>
        </div>
        {includeBranding && (
          <div
            className="z-0 justify-center px-8 py-2 text-center text-xs font-medium"
            style={{
              borderColor: colors?.border,
              backgroundColor: colors?.muted,
              color: colors?.mutedForeground,
            }}
          >
            Powered by{' '}
            <a
              className={cn('button-ring rounded', {
                'button-ring-light': !isDark,
              })}
              href="https://markprompt.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: colors?.primary }}
            >
              Chatjet.ai
            </a>
          </div>
        )}
      </div>
    );
  },
);

Playground.displayName = 'Playground';
