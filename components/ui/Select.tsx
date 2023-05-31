import * as Select from '@radix-ui/react-select';
import cn from 'classnames';
import { Check } from 'lucide-react';
import { ReactNode, forwardRef } from 'react';

export const SelectItem = forwardRef(
  (
    {
      children,
      className,
      ...props
    }: { children: ReactNode; className?: string } & any,
    forwardedRef,
  ) => {
    return (
      <Select.Item
        className={cn(
          className,
          'relative flex select-none items-center py-2 pl-6 pr-4 text-sm text-neutral-300 outline-none hover:bg-neutral-800',
        )}
        {...props}
        ref={forwardedRef}
      >
        <Select.ItemText>{children}</Select.ItemText>
        <Select.ItemIndicator className="absolute left-1 inline-flex justify-center">
          <Check className="h-3 w-3" />
        </Select.ItemIndicator>
      </Select.Item>
    );
  },
);

SelectItem.displayName = 'SelectItem';
