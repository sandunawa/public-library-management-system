import React, { useState } from 'react';
import { Book, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BookCoverProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  coverUrl?: string;
  category?: string;
  aspectRatio?: 'portrait' | 'square';
}

const colorPalettes = [
  'bg-primary-soft text-primary border-primary/20',
  'bg-secondary-soft text-secondary border-secondary/20',
  'bg-info-soft text-info border-info/20',
  'bg-warning-soft text-warning border-warning/20',
  'bg-muted text-foreground border-border',
  'bg-danger-soft text-danger border-danger/20',
];

function hashStringToPaletteIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % colorPalettes.length;
}

export const BookCover: React.FC<BookCoverProps> = ({
  title,
  coverUrl,
  category,
  aspectRatio = 'portrait',
  className,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const paletteIndex = hashStringToPaletteIndex(title + (category || ''));
  const paletteClass = colorPalettes[paletteIndex];

  const initials = title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  const ratioClass = aspectRatio === 'portrait' ? 'aspect-[2/3]' : 'aspect-square';

  if (coverUrl && !hasError) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-md border border-border shadow-subtle bg-muted',
          ratioClass,
          className
        )}
        {...props}
      >
        <img
          src={coverUrl}
          alt={`Cover of ${title}`}
          loading="lazy"
          onError={() => setHasError(true)}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-between p-3 rounded-md border shadow-subtle select-none',
        ratioClass,
        paletteClass,
        className
      )}
      aria-label={`Book cover: ${title}`}
      {...props}
    >
      <div className="w-full flex items-center justify-between opacity-60 text-xs">
        <BookOpen className="w-3.5 h-3.5" />
        <span className="font-mono text-[10px] tracking-wider truncate max-w-[60px]">
          {category || 'BOOK'}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center text-center my-auto px-1">
        <span className="font-heading font-bold text-lg tracking-wider opacity-80">
          {initials || 'BK'}
        </span>
        <span className="text-[11px] font-medium line-clamp-2 mt-1 opacity-90 leading-tight">
          {title}
        </span>
      </div>

      <div className="w-full h-1 rounded-full bg-current opacity-20 mt-auto" />
    </div>
  );
};
