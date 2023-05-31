import { MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Playground } from '@/components/files/Playground';
import { CONFIG_DEFAULT_VALUES } from '@/lib/context/config';
import { defaultTheme } from '@/lib/themes';
import { capitalize } from '@/lib/utils';

const demoPrompt = 'What is Markprompt?';

const demoResponse = `Markprompt is three things:

- A set of API endpoints that allow you to train your content and create a prompt to ask questions to it, for instance for a docs site.
- A [web dashboard](https://markprompt.com/) that makes it easy to do the above. The dashboard also allows you to set up syncing with a GitHub repo or a website, drag and drop files to train, manage access keys, and visualize stats on how users query your content.
- A set of UI components (currently [React](/docs#react) and [Web Component](#web-component)) that make it easy to integrate a prompt on your existing site.

Markprompt is [open source](https://github.com/motifland/markprompt), so you are free to host the dashboard and model backend on your own premises. We also warmly welcome [contributions](https://github.com/motifland/markprompt/pulls).`;

const demoReferenceIds = ['docs'];

const useOnScreen = (ref: any) => {
  const [isIntersecting, setIntersecting] = useState(false);

  const observer = useMemo(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    return new IntersectionObserver(([entry]) =>
      setIntersecting(entry.isIntersecting),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  useEffect(() => {
    if (!ref.current || !observer) {
      return;
    }
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [observer, ref]);

  return isIntersecting;
};

const PlaygroundSection = () => {
  const [autoplayPlayground, setAutoplayPlayground] = useState(false);
  const playgroundAnchorRef = useRef<HTMLDivElement | null>(null);
  const isInputVisible = useOnScreen(playgroundAnchorRef);

  useEffect(() => {
    if (isInputVisible) {
      setAutoplayPlayground(true);
    }
  }, [isInputVisible]);

  return (
    <div className="grid-background-sm grid-background-dark relative z-0 mx-auto bg-neutral-1000 px-6 py-24 sm:px-8 sm:py-32">
      <div className="glow-border-founded-lg glow-border-white-alt glow-border relative mx-auto h-[500px] w-full max-w-screen-md rounded-lg">
        <div className="absolute inset-0 z-0 rounded-xl border-2 bg-transparent" />
        <Playground
          isDemoMode
          isDark={true}
          hideCloseButton
          theme={{
            ...defaultTheme,
            colors: {
              ...defaultTheme.colors,
              dark: {
                ...defaultTheme.colors.dark,
                border: '#ffffff10',
              },
            },
            dimensions: { radius: '8px' },
          }}
          playing={autoplayPlayground}
          demoPrompt={demoPrompt}
          demoResponse={demoResponse}
          demoReferenceIds={demoReferenceIds}
          placeholder={CONFIG_DEFAULT_VALUES.placeholder}
          iDontKnowMessage={CONFIG_DEFAULT_VALUES.iDontKnowMessage}
          referencesHeading={CONFIG_DEFAULT_VALUES.referencesHeading}
          loadingHeading={CONFIG_DEFAULT_VALUES.loadingHeading}
          getReferenceInfo={(id) => {
            return { name: capitalize(id), href: id };
          }}
        />
        <div
          ref={playgroundAnchorRef}
          className="pointer-events-none absolute right-0 bottom-32 h-2 w-2 opacity-0"
        />
      </div>
      <div className="mx-auto mt-8 flex w-full max-w-screen-md justify-end">
        <div className="rounded-full border border-sky-500 bg-sky-600 p-3 shadow">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
};

export default PlaygroundSection;
