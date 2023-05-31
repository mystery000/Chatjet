import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

import { deleteUserAccessToken } from '@/lib/supabase';
import { fetcher } from '@/lib/utils';
import { OAuthProvider, OAuthToken } from '@/types/types';

import useUser from '../use-user';

type TokenState = 'no_token' | 'expired' | 'valid';

const toQueryString = (params: { [key: string]: string }) => {
  return Object.keys(params)
    .map((k) => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
};

const toUrl = (url: string, params: { [key: string]: string }) => {
  return url + '?' + toQueryString(params);
};

const getOAuthUrl = (
  provider: OAuthProvider,
  userEmail: string,
  state: string,
) => {
  switch (provider) {
    case 'github': {
      const params = {
        client_id: process.env.NEXT_PUBLIC_GITHUB_APP_CLIENT_ID || '',
        login: userEmail,
        state,
      };
      const appId =
        process.env.NODE_ENV === 'production'
          ? 'markprompt'
          : 'markprompt-local';
      return toUrl(
        `https://github.com/apps/${appId}/installations/new`,
        params,
      );
    }
  }
};

const centerRectOnScreen = (targetWidth: number, targetHeight: number) => {
  const left = (window.innerWidth - targetWidth) / 2 + window.screenLeft;
  const top = (window.innerHeight - targetHeight) / 4 + window.screenTop;
  return { width: targetWidth, height: targetHeight, left, top };
};

export default function useOAuth() {
  const { user } = useUser();
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const { data: tokens, mutate: mutateAccessTokens } = useSWR(
    user?.id ? `/api/oauth/access-tokens` : null,
    fetcher<OAuthToken[]>,
  );

  const showAuthPopup = useCallback(
    async (provider: OAuthProvider, state: string) => {
      if (!user?.email) {
        return;
      }

      if (typeof window === 'undefined') {
        return;
      }

      const { width, height, left, top } = centerRectOnScreen(600, 800);

      setWaitingForAuth(true);

      let didClosePopupManually = false;

      const popup = window.open(
        getOAuthUrl(provider, user.email, state),
        'popup',
        `width=${width},height=${height},top=${top},left=${left}`,
      );

      // Detect if the window was closed explicitly by the user,
      // in which case we want to reset the waiting state.
      const onCloseTimer = window.setInterval(() => {
        // !== is required for compatibility with Opera
        if (popup?.closed !== false) {
          window.clearInterval(onCloseTimer);
          didClosePopupManually = true;
        }
      }, 200);

      const isAuthed = await new Promise((resolve) => {
        const checkIsAuthed = async () => {
          const { data } = await supabase
            .from('user_access_tokens')
            .select('expires')
            .match({ user_id: user.id, provider })
            .limit(1)
            .maybeSingle();

          if (data?.expires && data.expires > Date.now()) {
            if (popup && !popup.closed) {
              window.clearInterval(onCloseTimer);
              popup.close();
            }
            resolve(true);
            await mutateAccessTokens();
          } else {
            setTimeout(() => {
              if (didClosePopupManually) {
                // If windows was closed manually, reset the state.
                resolve(null);
              } else {
                checkIsAuthed();
              }
            }, 1000);
          }
        };

        checkIsAuthed();
      });

      setWaitingForAuth(false);
      return isAuthed;
    },
    [user?.email, user?.id, supabase, mutateAccessTokens],
  );

  const disconnect = useCallback(
    async (provider: OAuthProvider) => {
      if (!user?.id) {
        return;
      }
      const error = await deleteUserAccessToken(supabase, user.id, provider);
      if (error) {
        console.error('Error disconnecting', error);
        return error;
      } else {
        mutateAccessTokens();
        return undefined;
      }
    },
    [supabase, user?.id, mutateAccessTokens],
  );

  const getTokenData = useCallback(
    (provider: OAuthProvider): OAuthToken | undefined => {
      return tokens?.find((t) => t.provider === provider);
    },
    [tokens],
  );

  const getTokenState = useCallback(
    (provider: OAuthProvider): TokenState => {
      const token = tokens?.find(
        (t) => t.provider === provider && !!t.access_token,
      );
      if (!token) {
        return 'no_token';
      }
      if (token?.expires && token.expires > Date.now()) {
        return 'valid';
      }
      return 'expired';
    },
    [tokens],
  );

  const githubAccessToken = useMemo(() => {
    return getTokenData('github');
  }, [getTokenData]);

  return {
    tokens,
    loading: waitingForAuth,
    showAuthPopup,
    disconnect,
    getTokenData,
    getTokenState,
    githubAccessToken,
  };
}
