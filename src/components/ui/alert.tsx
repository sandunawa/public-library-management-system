import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
  {
    variants: {
      variant: {
        default: 'bg-card text-foreground border-border',
        info: 'bg-info-soft text-info-soft-foreground border-info/20 [&>svg]:text-info',
        success: 'bg-success-soft text-success-soft-foreground border-success/20 [&>svg]:text-success',
        warning: 'bg-warning-soft text-warning-soft-foreground border-warning/20 [&>svg]:text-warning',
        destructive: 'bg-danger-soft text-danger-soft-foreground border-danger/20 [&>svg]:text-danger',
        danger: 'bg-danger-soft text-danger-soft-foreground border-danger/20 [&>svg]:text-danger',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
  danger: AlertCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, onDismiss, ...props }, ref) => {
    const Icon = iconMap[variant || 'default'];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className="h-5 w-5" />
        <div className="flex-1">{children}</div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 text-current opacity-70 hover:opacity-100 p-1 rounded-md"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight font-heading', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed opacity-90', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
