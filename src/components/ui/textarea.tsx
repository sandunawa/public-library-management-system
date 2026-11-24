import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-[10px] border border-input bg-card px-3 py-2 text-sm shadow-subtle placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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
Textarea.displayName = 'Textarea';

export { Textarea };
