import * as React from 'react';
import { cn } from '@/lib/utils';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground bg-muted border border-border shadow-xs select-none',
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  }
);
Kbd.displayName = 'Kbd';
