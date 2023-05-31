import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeMinimal } from '@supabase/auth-ui-shared';
import Link from 'next/link';
import { FC } from 'react';

import { MarkpromptIcon } from '@/components/icons/Markprompt';
import Button from '@/components/ui/Button';
import useUser from '@/lib/hooks/use-user';
import { getAppOrigin } from '@/lib/utils.edge';

type AuthPageProps = {
  type: 'signin' | 'signup';
};

const AuthPage: FC<AuthPageProps> = ({ type }) => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const { signOut } = useUser();

  return (
    <div className="px-6 sm:px-8">
      <div className="mx-auto w-min">
        <Link href="/">
          <MarkpromptIcon className="mx-auto mt-16 h-16 w-16 text-white outline-none" />
        </Link>
      </div>
      {!session ? (
        <>
          <div className="mx-auto mt-16 max-w-sm">
            <Auth
              view={type === 'signup' ? 'sign_up' : 'sign_in'}
              redirectTo={getAppOrigin() + '/'}
              onlyThirdPartyProviders
              socialLayout="vertical"
              providers={['github', 'google']}
              supabaseClient={supabase}
              appearance={{ theme: ThemeMinimal }}
              theme="default"
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                  },
                  sign_up: {
                    email_label: 'Email',
                    password_label: 'Password',
                  },
                },
              }}
            />
          </div>
          <p className="mt-24 text-center text-sm text-neutral-500">
            Have a custom company use case?{' '}
            <a
              className="subtle-underline"
              href={`mailto:${process.env.NEXT_PUBLIC_SALES_EMAIL!}`}
            >
              Get enterprise assistance
            </a>
            .
          </p>
          <p className="mt-12 text-center text-sm text-neutral-500">
            By signing in, you agree to our{' '}
            <Link className="subtle-underline" href="/legal/terms">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link className="subtle-underline" href="/legal/privacy">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      ) : (
        <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-2 p-8 pt-20 text-neutral-300">
          <p className="mb-4">You are already signed in.</p>
          <Button asLink className="w-full" variant="plain" href="/">
            Go to app
          </Button>
          <Button className="w-full" variant="bordered" onClick={signOut}>
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
