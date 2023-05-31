import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import cn from 'classnames';
import Link from 'next/link';
import { FC } from 'react';

import { useAppContext } from '@/lib/context/app';
import useOnboarding from '@/lib/hooks/use-onboarding';
import useUser from '@/lib/hooks/use-user';

import { MarkpromptIcon } from '../icons/Markprompt';
import TeamProjectPicker from '../team/TeamProjectPicker';
import Button from '../ui/Button';
import { ContactWindow } from '../user/ChatWindow';
import ProfileMenu from '../user/ProfileMenu';

type AppNavbarProps = {
  animated?: boolean;
};

export const AppNavbar: FC<AppNavbarProps> = ({ animated }) => {
  const { user, loading: loadingUser } = useUser();
  const { finishOnboarding } = useOnboarding();
  const { didCompleteFirstQuery } = useAppContext();

  return (
    <div
      className={cn(
        animated && 'animate-slide-down-delayed',
        'fixed inset-x-0 top-0 z-20 flex h-[var(--app-navbar-height)] flex-none flex-row items-center gap-4 border-b border-neutral-900 bg-neutral-1100 px-4',
      )}
    >
      <div className="flex-none">
        <Link href="/" className="outline-none">
          <MarkpromptIcon className="mx-auto h-8 w-8 text-white" />
        </Link>
      </div>
      {!!user?.has_completed_onboarding && !loadingUser && (
        <TeamProjectPicker />
      )}
      {!user?.has_completed_onboarding && !loadingUser && (
        <p className="text-sm font-medium text-neutral-300">Onboarding</p>
      )}
      <div className="flex-grow" />
      <div className="flex flex-none items-center gap-4">
        <NavigationMenu.Root>
          <NavigationMenu.List className="flex flex-row items-center gap-2 px-2 py-1">
            {!loadingUser && !user?.has_completed_onboarding && (
              <>
                {!didCompleteFirstQuery && (
                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Button
                        className="mr-4"
                        variant="plain"
                        buttonSize="sm"
                        onClick={() => {
                          finishOnboarding();
                        }}
                      >
                        Skip onboarding →
                      </Button>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                )}
              </>
            )}
            <ContactWindow
              closeOnClickOutside
              Component={
                <NavigationMenu.Item>
                  <NavigationMenu.Link
                    asChild
                    className="button-ring block h-full rounded-md px-2 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 focus-visible:text-neutral-100"
                  >
                    <button className="text-neutral-300hover:bg-neutral-900 block h-full rounded-md px-2 py-1.5 text-sm hover:text-neutral-100 focus-visible:text-neutral-100">
                      Help
                    </button>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              }
            />
            <NavigationMenu.Item>
              <NavigationMenu.Link
                asChild
                className="button-ring block h-full rounded-md px-2 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 focus-visible:text-neutral-100"
              >
                <a target="_blank" rel="noreferrer" href="/docs">
                  Docs
                </a>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>
        <ProfileMenu />
      </div>
    </div>
  );
};
