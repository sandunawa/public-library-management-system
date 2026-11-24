import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  badge,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-border mb-6',
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading md:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
};
