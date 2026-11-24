import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm text-foreground shadow-subtle ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px]',
          hasError && 'border-danger focus-visible:ring-danger',
          className
        )}
        ref={ref}
        aria-invalid={hasError ? 'true' : undefined}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
