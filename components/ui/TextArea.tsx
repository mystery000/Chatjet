import cn from 'classnames';
import { FC, ReactNode } from 'react';

type TextAreaProps = {
  textAreaSize?: 'sm' | 'base' | 'md' | 'lg';
  variant?: 'plain' | 'glow';
  children?: ReactNode;
  className?: string;
} & any;

export const NoAutoTextArea = (props: any) => {
  return (
    <TextArea
      {...props}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
    />
  );
};

const TextArea: FC<TextAreaProps> = ({
  textAreaSize: s,
  variant,
  className,
  ...props
}) => {
  const textAreaSize = s ?? 'base';
  return (
    <textarea
      {...props}
      value={props.value || undefined}
      className={cn(className, 'input-base input-base-border input-focus', {
        'px-2 py-2 text-sm': textAreaSize === 'base',
        'px-2 py-1.5 text-sm': textAreaSize === 'sm',
        'input-glow-color': variant === 'glow',
      })}
    />
  );
};

export default TextArea;
