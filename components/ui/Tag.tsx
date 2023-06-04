import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import { TagColor } from '@/types/types';

type TagProps = {
  className?: string;
  color?: TagColor;
  size?: 'xs' | 'sm' | 'base';
  rounded?: boolean;
  children: ReactNode;
};

export const Tag: FC<TagProps> = ({
  className,
  color = 'fuchsia',
  size = 'sm',
  rounded,
  children,
}) => {
  return (
    <span
      className={classNames(
        className,
        'w-min transform items-center gap-2 whitespace-nowrap font-medium transition',
        {
          'rounded-full': !rounded,
          rounded: rounded,
          'bg-primary-900/20 text-primary-400': color === 'fuchsia',
          'bg-orange-900/20 text-orange-400': color === 'orange',
          'bg-sky-900/20 text-sky-400': color === 'sky',
          'bg-green-900/20 text-green-400': color === 'green',
          'px-3 py-1.5 text-sm': size === 'base',
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2 py-[1px] text-[11px]': size === 'xs',
        },
      )}
    >
      {children}
    </span>
  );
};
