import cn from 'classnames';
import { AlertTriangle, Info } from 'lucide-react';
import { ReactNode, FC } from 'react';

type NoteType = 'info' | 'warning' | 'error';

type IconProps = {
  type?: NoteType;
  className?: string;
};

const Icon: FC<IconProps> = ({ type, className }) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className={cn(className, 'text-orange-500')} />;
    default:
      return <Info className={cn(className, 'text-sky-500')} />;
  }
};

type NoteProps = {
  size?: 'sm' | 'base';
  className?: string;
  type?: NoteType;
  children?: ReactNode;
};

export const Note: FC<NoteProps> = ({ size, className, type, children }) => {
  const noteSize = size || 'base';
  return (
    <div
      className={cn(
        className,
        'flex flex-row items-start gap-4 rounded-md border border-neutral-900 bg-neutral-1000',
        {
          'py-2 px-3': noteSize === 'sm',
          'p-4': noteSize === 'base',
        },
      )}
    >
      <Icon
        type={type}
        className={cn('mt-1 flex-none', {
          'h-5 w-5': noteSize === 'base',
          'h-4 w-4': noteSize === 'sm',
        })}
      />
      <div
        className={cn('flex-grow text-neutral-300 prose-p:my-0', {
          'text-sm': noteSize === 'sm',
        })}
      >
        {children}
      </div>
    </div>
  );
};
