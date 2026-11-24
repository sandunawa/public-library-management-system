import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  className,
  ...props
}) => {
  return (
    <Card className={cn('overflow-hidden', className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="p-2.5 rounded-lg bg-primary-soft text-primary">
              <Icon className="w-5 h-5 stroke-[1.75]" />
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading tabular-nums">
            {value}
          </div>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              {trend && (
                <span
                  className={cn(
                    'font-medium',
                    trendPositive ? 'text-success' : 'text-danger'
                  )}
                >
                  {trend}
                </span>
              )}
              {subtitle && <span>{subtitle}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
