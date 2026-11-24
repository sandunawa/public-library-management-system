import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        secondary: 'bg-secondary-soft text-secondary-soft-foreground border border-secondary/20',
        destructive: 'bg-danger-soft text-danger-soft-foreground border border-danger/20',
        danger: 'bg-danger-soft text-danger-soft-foreground border border-danger/20',
        outline: 'border border-border text-foreground',
        success: 'bg-success-soft text-success-soft-foreground border border-success/20',
        warning: 'bg-warning-soft text-warning-soft-foreground border border-warning/20',
        info: 'bg-info-soft text-info-soft-foreground border border-info/20',
        muted: 'bg-muted text-muted-foreground border border-border',
      },
      size: {
        default: 'text-xs px-2.5 py-0.5',
        sm: 'text-[11px] px-2 py-0.2',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
