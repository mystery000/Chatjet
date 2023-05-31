import * as Switch from '@radix-ui/react-switch';
import cn from 'classnames';
import Head from 'next/head';

import { NavLayout } from '@/components/layouts/NavLayout';
import { updateUser } from '@/lib/api';
import { useAppContext } from '@/lib/context/app';
import useOnboarding from '@/lib/hooks/use-onboarding';
import useUser from '@/lib/hooks/use-user';

import PlaygroundDashboard from '../files/PlaygroundDashboard';
import Button from '../ui/Button';

const Onboarding = () => {
  const { user, mutate: mutateUser } = useUser();
  const { finishOnboarding } = useOnboarding();
  const { didCompleteFirstQuery } = useAppContext();

  return (
    <>
      <Head>
        <title>Get started | Markprompt</title>
      </Head>
      <NavLayout animated={false}>
        <div className="fixed top-[var(--app-navbar-height)] bottom-0 left-0 right-0">
          <div
            className={cn(
              'animated-max-height absolute inset-x-0 top-0 h-full flex-grow transform transition duration-300',
              {
                'border-b border-neutral-900': didCompleteFirstQuery,
              },
            )}
            style={{
              maxHeight: didCompleteFirstQuery
                ? 'calc(100% - var(--onboarding-footer-height))'
                : '100%',
            }}
          >
            <PlaygroundDashboard isOnboarding />
          </div>
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 flex flex-none transform flex-row items-center justify-end gap-8 px-6 py-6 transition delay-300 duration-500',
              {
                'pointer-events-none translate-y-[10px] opacity-0':
                  !didCompleteFirstQuery,
                ' bottom-0 opacity-100': didCompleteFirstQuery,
              },
            )}
            style={{
              height: 'var(--onboarding-footer-height)',
            }}
          >
            <form>
              <div className="flex flex-row items-center gap-4">
                <label
                  className="flex-grow truncate text-sm text-neutral-300"
                  htmlFor="product-updates"
                >
                  Subscribe to product updates
                </label>
                <Switch.Root
                  className="switch-root"
                  id="product-updates"
                  checked={!!user?.subscribe_to_product_updates}
                  onCheckedChange={async (checked: boolean) => {
                    await updateUser({
                      subscribe_to_product_updates: checked,
                    });
                    await mutateUser();
                  }}
                >
                  <Switch.Thumb className="switch-thumb" />
                </Switch.Root>
              </div>
            </form>
            <Button
              variant="cta"
              onClick={() => {
                finishOnboarding();
              }}
            >
              Go to dashboard →
            </Button>
          </div>
        </div>
      </NavLayout>
    </>
  );
};

export default Onboarding;
