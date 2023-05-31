import cn from 'classnames';
import { FC } from 'react';

type VideoProps = {
  src?: string;
};

export const Video: FC<VideoProps> = ({ src }) => {
  return (
    <div className={cn('overflow-hidden rounded-md border border-neutral-900')}>
      <video
        autoPlay={true}
        className="w-full"
        preload="auto"
        src={src}
      ></video>
    </div>
  );
};
