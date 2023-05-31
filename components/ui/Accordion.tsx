import * as Accordion from '@radix-ui/react-accordion';
import cn from 'classnames';
import { ChevronDown } from 'lucide-react';
import { ReactNode, forwardRef } from 'react';

export const AccordionTrigger = forwardRef(
  (
    {
      children,
      className,
      ...props
    }: { children: ReactNode; className: string } & any,
    forwardedRef,
  ) => (
    <Accordion.Header className="w-full transition hover:opacity-70">
      <Accordion.Trigger
        className={cn(
          'no-ring accordion-trigger group flex w-full flex-row items-center justify-between gap-2 rounded-md text-sm font-medium text-neutral-500 transition focus:text-neutral-300 focus:outline-none',
          className,
        )}
        {...props}
        ref={forwardedRef}
      >
        {children}
        <ChevronDown
          className="accordion-chevron h-4 w-4 -rotate-90 transform text-neutral-500 transition group-focus:text-neutral-300"
          aria-hidden
        />
      </Accordion.Trigger>
    </Accordion.Header>
  ),
);

AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = forwardRef(
  (
    {
      children,
      className,
      ...props
    }: { children: ReactNode; className: string } & any,
    forwardedRef,
  ) => (
    <Accordion.Content className={className} {...props} ref={forwardedRef}>
      {children}
    </Accordion.Content>
  ),
);

AccordionContent.displayName = 'AccordionContent';
