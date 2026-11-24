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
    <Card className={cn('overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#1E0FA8]/50 hover:shadow-md transition-all group', className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          {Icon && (
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-[#1E0FA8] border border-indigo-100 group-hover:scale-105 transition-transform shadow-xs">
              <Icon className="w-5 h-5 stroke-[2]" />
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading tabular-nums">
            {value}
          </div>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
              {trend && (
                <span
                  className={cn(
                    'font-bold',
                    trendPositive ? 'text-emerald-600' : 'text-rose-600'
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
