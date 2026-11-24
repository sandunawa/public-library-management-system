import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  imageSrc?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionNode?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  imageSrc,
  actionLabel,
  onAction,
  actionNode,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-border bg-card/60 animate-fade-in',
        className
      )}
      {...props}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          loading="lazy"
          className="w-40 h-32 object-contain mb-4 opacity-90"
        />
      ) : Icon ? (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
          <Icon className="w-6 h-6 stroke-[1.75]" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-foreground font-heading mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {actionNode ? (
        actionNode
      ) : actionLabel && onAction ? (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};
