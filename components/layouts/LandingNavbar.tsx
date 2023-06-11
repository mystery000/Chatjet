import { useSession } from '@supabase/auth-helpers-react';
import cn from 'classnames';
import Link from 'next/link';

import { DiscordIcon } from '../icons/Discord';
import { GitHubIcon } from '../icons/GitHub';
import { MarkpromptIcon } from '../icons/Markprompt';
import { ContactWindow } from '../user/ChatWindow';
import React, { useState } from 'react';

export default function LandingNavbar({
  noAnimation,
}: {
  noAnimation?: boolean;
}) {
  const session = useSession();

  const [navbar, setNavbar] = useState(false);

  return (
    <div
      className={cn(
        'relative z-10 flex flex-row items-center justify-between gap-6 px-[14px] py-[19px]',
        {
          'animate-slide-down-delayed': !noAnimation,
        },
      )}
    >
      <Link href="/">
        <div className="flex flex-none flex-row items-center gap-4 text-white">
          <MarkpromptIcon className="mx-auto text-white max768:h-[34px] max768:w-[115px]" />
          {/* <div className="hidden text-lg font-semibold transition hover:opacity-80 lg:block">
            Markprompt
          </div> */}
        </div>
      </Link>{' '}
      <div
        className={`top-full left-0 z-20 flex h-fit gap-10 bg-black max1200:absolute max1200:w-full max1200:flex-col max1200:gap-6 max1200:p-9 ${
          navbar
            ? 'pointer-events-all max1200:opacity-100'
            : 'pointer-events-none max1200:opacity-0'
        }`}
        style={{ transition: 'all .25s' }}
      >
        <NavLink link="/" label="Features" />
        <NavLink link="/" label="About" />
        <NavLink link="/" label="Pricing" />
        <NavLink link="/" label="Case Study" />
        <NavLink link="/" label="Contact" />
      </div>
      {/* <ContactWindow
          closeOnClickOutside
          Component={
            <button
              className="hidden transform whitespace-nowrap text-sm font-medium text-white hover:opacity-100 sm:block"
              aria-label="Contact us"
            >
              Contact us
            </button>
          }
        /> */}
      {/* {session ? (
        <Link
          className="button-glow flex flex-row items-center gap-3 rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-300"
          href="/"
        >
          Go to app
        </Link>
      ) : (
        <>
          <Link
            className="hidden transform whitespace-nowrap text-sm font-medium text-white hover:opacity-100 sm:block"
            href="/signup"
          >
            Sign up
          </Link>
          <Link
            className="button-glow flex flex-row items-center gap-3 whitespace-nowrap rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-300"
            href="/login"
          >
            Sign in
          </Link>
        </>
      )} */}
      {/* <a
          className="hidden transform text-sm font-medium text-white hover:opacity-100 lg:block"
          href="https://github.com/motifland/markprompt"
          aria-label="Markprompt on GitHub"
        >
          <GitHubIcon className="h-5 w-5" />
        </a> */}
      {/* <a
          className="hidden transform text-sm font-medium text-white hover:opacity-100 lg:block"
          href="https://discord.gg/MBMh4apz6X"
          aria-label="Markprompt on Discord"
        >
          <DiscordIcon className="h-5 w-5" />
        </a> */}
      <div className="flex gap-6">
        <Link
          href={'/'}
          className="h-full cursor-pointer rounded-lg border border-[rgba(78,80,85)] px-5 py-3 font-medium max768:hidden"
        >
          Build Your Chatbot Now
        </Link>
        <button
          className="hidden h-fit cursor-pointer flex-col justify-center gap-1.5 self-center rounded-[4px] border border-white p-2.5 max1200:flex "
          onClick={() => {
            setNavbar(!navbar);
          }}
        >
          <span
            className={`h-0.5 w-6 bg-white transition-all ${
              navbar ? 'translate-y-2 rotate-45' : 'opacity-100'
            }`}
          ></span>
          <span
            className={`h-0.5 w-6 bg-white transition-all ${
              navbar ? 'opacity-0' : 'opacity-100'
            }`}
          ></span>
          <span
            className={`h-0.5 w-6 bg-white transition-all ${
              navbar ? '-translate-y-2 -rotate-45' : 'opacity-100'
            }`}
          ></span>
        </button>
      </div>
    </div>
  );
}

const NavLink: React.FC<{ link: string; label: string }> = (props) => {
  return (
    <Link
      className="relative cursor-pointer overflow-hidden p-1 text-base text-white transition-all"
      href={props.link}
    >
      <p className="cursor-pointer"> {props.label}</p>
      <p className="absolute top-[150%] left-1/2 w-full -translate-x-1/2 cursor-pointer">
        {' '}
        {props.label}
      </p>
    </Link>
  );
};
