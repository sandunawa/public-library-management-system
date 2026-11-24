import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
            {label}
            {required && (
              <span className="text-danger ml-1" aria-hidden="true">
                *
              </span>
            )}
            {required && <span className="sr-only"> (required)</span>}
          </Label>
        </div>
      )}
      {children}
      {hint && !error && (
        <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
          className="text-xs font-medium text-danger flex items-center gap-1"
        >
          {error}
        </p>
      )}
    </div>
  );
};
