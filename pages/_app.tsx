import '@/styles/globals.css';

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import {
  SessionContextProvider,
  useSession,
} from '@supabase/auth-helpers-react';
import { PlainProvider } from '@team-plain/react-chat-ui';
import { Analytics } from '@vercel/analytics/react';
import * as Fathom from 'fathom-client';
import { NextComponentType, NextPageContext } from 'next';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';
import { SWRConfig } from 'swr';

import { Toaster } from '@/components/ui/Toaster';
import {
  MarkpromptPromptWindow,
  plainTheme,
} from '@/components/user/ChatWindow';
import { ManagedAppContext } from '@/lib/context/app';
import { ManagedConfigContext } from '@/lib/context/config';
import { ManagedTrainingContext } from '@/lib/context/training';
import useUser from '@/lib/hooks/use-user';
import { getAppHost } from '@/lib/utils.edge';

interface CustomAppProps<P = any> extends AppProps<P> {
  Component: NextComponentType<NextPageContext, any, P> & {
    getLayout?: (page: ReactNode) => JSX.Element;
    title?: string;
  };
}

const getCustomerJwt = async () => {
  return fetch('/api/user/jwt')
    .then((res) => res.json())
    .then((res) => res.customerJwt);
};

export default function App({ Component, pageProps }: CustomAppProps) {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    const origin = getAppHost();
    if (!process.env.NEXT_PUBLIC_FATHOM_SITE_ID || !origin) {
      return;
    }

    Fathom.load(process.env.NEXT_PUBLIC_FATHOM_SITE_ID, {
      includedDomains: [origin],
    });

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }
    router.events.on('routeChangeComplete', onRouteChangeComplete);

    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SWRConfig
        value={{
          dedupingInterval: 10000,
        }}
      >
        <ThemeProvider defaultTheme="dark" attribute="class">
          <SessionContextProvider
            supabaseClient={supabase}
            initialSession={(pageProps as any).initialSession}
          >
            <ManagedPlainProvider>
              <ManagedAppContext>
                <ManagedTrainingContext>
                  <ManagedConfigContext>
                    <Component {...pageProps}></Component>
                    {!(Component as any).hideChat && (
                      <PromptOutsideOnboarding />
                    )}
                    <Toaster />
                  </ManagedConfigContext>
                </ManagedTrainingContext>
              </ManagedAppContext>
            </ManagedPlainProvider>
          </SessionContextProvider>
        </ThemeProvider>
        <Analytics />
      </SWRConfig>
    </>
  );
}

export const ManagedPlainProvider = ({ children }: { children: ReactNode }) => {
  const session = useSession();

  return (
    <PlainProvider
      appKey={process.env.NEXT_PUBLIC_PLAIN_APP_KEY!}
      customer={
        session?.user
          ? { type: 'logged-in', getCustomerJwt }
          : { type: 'logged-out' }
      }
      theme={plainTheme}
    >
      {children}
    </PlainProvider>
  );
};

export const PromptOutsideOnboarding = () => {
  const { user } = useUser();

  // Don't show chat in the bottom left during onboarding.
  if (user && !user.has_completed_onboarding) {
    return <></>;
  }

  // return <ChatWindow closeOnClickOutside />;
  return <MarkpromptPromptWindow />;
};
