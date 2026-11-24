import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  className?: string;
  onStepClick?: (stepIndex: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  className,
  onStepClick,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <nav aria-label="Progress Stepper">
        <ol className="flex items-center justify-between w-full">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <li
                key={step.id}
                className={cn(
                  'flex-1 relative flex items-center',
                  idx !== steps.length - 1 && 'after:content-[""] after:w-full after:h-0.5 after:border-b after:border-border after:inline-block'
                )}
              >
                <button
                  type="button"
                  disabled={!onStepClick || idx > currentStep}
                  onClick={() => onStepClick && onStepClick(idx)}
                  className={cn(
                    'flex items-center gap-2 text-left z-10 shrink-0 bg-background pr-2',
                    onStepClick && idx <= currentStep ? 'cursor-pointer' : 'cursor-default'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0',
                      isCompleted && 'bg-[#15803D] text-white',
                      isCurrent && 'bg-[#7654D7] text-white ring-4 ring-[#7654D7]/20',
                      !isCompleted && !isCurrent && 'bg-muted text-muted-foreground border border-border'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </span>
                  <span className="hidden sm:inline-block">
                    <span
                      className={cn(
                        'block text-xs font-bold leading-tight',
                        isCurrent ? 'text-[#7654D7]' : 'text-foreground'
                      )}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="block text-[11px] text-muted-foreground">
                        {step.description}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
