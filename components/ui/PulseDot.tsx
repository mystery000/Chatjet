import cn from 'classnames';
import { FC } from 'react';

type PulseDotProps = {
  className?: string;
};

export const PulseDot: FC<PulseDotProps> = ({ className }) => {
  return (
    <div className={cn(className, 'inline-block')}>
      <span className="relative flex h-[10px] w-[10px]">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75"></span>
        <span className="relative inline-flex h-[10px] w-[10px] rounded-full bg-fuchsia-500"></span>
      </span>
    </div>
  );
};
