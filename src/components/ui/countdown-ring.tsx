import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CountdownRingProps {
  secondsRemaining: number;
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  secondsRemaining,
  totalSeconds,
  size = 64,
  strokeWidth = 6,
  className,
  label = 'Resetting',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center select-none', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-[#7654D7] transition-all duration-300 ease-linear"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono font-bold text-sm text-foreground leading-none">
          {secondsRemaining}s
        </span>
        {label && (
          <span className="text-[9px] uppercase font-bold text-muted-foreground mt-0.5 scale-90">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
