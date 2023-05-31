import cn from 'classnames';
import { FC, ReactNode } from 'react';

export const NoAutoInput = (props: any) => {
  return (
    <Input
      {...props}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
    />
  );
};

type InputWrapperProps = {
  inputSize?: 'sm' | 'base' | 'md' | 'lg';
  variant?: 'plain' | 'glow';
  children?: ReactNode;
  className?: string;
  rightAccessory?: string | ReactNode;
} & any;

const InputWrapper: FC<InputWrapperProps> = ({
  children,
  className,
  leftAccessory,
  rightAccessory,
}) => {
  if (rightAccessory || leftAccessory) {
    return (
      <div
        className={cn(
          className,
          'input-wrapper group flex flex-row items-center transition focus-within:border-transparent focus-within:outline-none focus-within:ring-2 focus-within:ring-white/50',
        )}
      >
        {typeof leftAccessory === 'string' ? (
          <div className="flex-none whitespace-nowrap px-2 text-sm text-neutral-500">
            {leftAccessory}
          </div>
        ) : (
          <>{leftAccessory}</>
        )}
        <div className="flex-grow">{children}</div>
        {typeof rightAccessory === 'string' ? (
          <div className="flex-none whitespace-nowrap px-2 text-sm text-neutral-500">
            {rightAccessory}
          </div>
        ) : (
          <>{rightAccessory}</>
        )}
      </div>
    );
  }

  return children;
};

type InputProps = {
  inputSize?: 'sm' | 'base' | 'md' | 'lg';
  variant?: 'plain' | 'glow';
  children?: ReactNode;
  className?: string;
  wrapperClassName?: string;
  leftAccessory?: string | ReactNode;
  rightAccessory?: string | ReactNode;
} & any;

const Input: FC<InputProps> = ({
  inputSize: s,
  variant,
  className,
  wrapperClassName,
  leftAccessory,
  rightAccessory,
  ...props
}) => {
  const inputSize = s ?? 'base';
  const hasLeftAccessory = !!leftAccessory;
  const hasRightAccessory = !!rightAccessory;

  console.log(
    'Value',
    typeof props.value,
    typeof props.value === 'string' ? props.value : '',
  );
  return (
    <InputWrapper
      className={wrapperClassName}
      leftAccessory={leftAccessory}
      rightAccessory={rightAccessory}
    >
      <input
        {...props}
        value={typeof props.value !== 'undefined' ? props.value : ''}
        className={cn(
          className,
          'input-base max-w-full focus:border-transparent',
          {
            'input-base-border input-focus':
              !hasRightAccessory && !hasLeftAccessory,
            'input-base-noborder focus:outline-none':
              hasRightAccessory || hasLeftAccessory,
            'w-full flex-grow': hasRightAccessory || hasLeftAccessory,
            'px-2 py-2 text-sm': inputSize === 'base',
            'px-2 py-1.5 text-sm': inputSize === 'sm',
            'input-glow-color': variant === 'glow',
          },
        )}
      />
    </InputWrapper>
  );
};

export default Input;
