import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  children: React.ReactNode;
  className?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  children,
  className,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions toolbar"
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#242335] text-white px-5 py-3 rounded-2xl shadow-elevated border border-white/10 animate-fade-in backdrop-blur-md max-w-[95vw]',
        className
      )}
    >
      <div className="flex items-center gap-2 pr-3 border-r border-white/20 text-xs font-semibold">
        <span className="w-6 h-6 rounded-full bg-[#7654D7] text-white flex items-center justify-center font-bold text-[11px]">
          {selectedCount}
        </span>
        <span>
          Selected {totalCount ? `of ${totalCount}` : ''}
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition-colors ml-1"
          title="Clear Selection"
          aria-label="Clear Selection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
};
