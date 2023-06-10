import React from 'react';
import { MarkpromptIcon } from '../icons/Markprompt';
import Link from 'next/link';

const AppFooter = () => {
  return (
    <footer className="mx-auto flex max-w-[75%] flex-wrap justify-between gap-y-12 rounded-2xl py-14">
      <div className="flex max-w-[22rem] flex-col items-start gap-6">
        <MarkpromptIcon className=" text-white max768:h-[34px] max768:w-[115px]" />
        <span className="left-6 font-medium text-[rgb(186,187,195)]">
          In the new era of technology we look a in the future with certainty
          and pride to for our company and business.
        </span>
      </div>
      <div className="flex gap-12 max768:flex-wrap">
        <div className="flex flex-col gap-12">
          <span className="text-[rgb(125,127,131)]">Pages</span>
          <ul className="flex flex-col gap-5">
            <li>
              <Link href={'/'}>Features</Link>
            </li>
            <li>
              <Link href={'/'}>Pricing</Link>
            </li>
            <li>
              <Link href={'/'}>Features</Link>
            </li>
            <li>
              <Link href={'/'}>About us</Link>
            </li>
            <li>
              <Link href={'/'}>Contact</Link>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-12">
          <span className="text-[rgb(125,127,131)]">Legal Pages</span>
          <ul className="flex flex-col gap-5">
            <li>
              <Link href={'/'}>Privacy Policy</Link>
            </li>
            <li>
              <Link href={'/'}>Terms & Conditions</Link>
            </li>
            <li>
              <Link href={'/'}>Refund Policy</Link>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-12">
          <span className="text-[rgb(125,127,131)]">Connect with us</span>
          <ul className="flex flex-col gap-5">
            <li>
              <Link href={'/'}>Linkedin</Link>
            </li>
            <li>
              <Link href={'/'}>Twitter</Link>
            </li>
            <li>
              <Link href={'/'}>Facebook</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
