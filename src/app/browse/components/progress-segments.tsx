'use client';

import { cn } from '@/lib/utils';

interface ProgressSegmentsProps {
  total: number;
  activeIdx: number;
  isActive: boolean;
}

export function ProgressSegments({
  total,
  activeIdx,
  isActive,
}: ProgressSegmentsProps) {
  if (total <= 1) return null;
  return (
    <div className="absolute top-3 left-3 right-3 flex gap-1 z-10 pointer-events-none">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden"
        >
          {i < activeIdx && <div className="h-full w-full bg-white" />}
          {i === activeIdx && (
            <div
              key={`${activeIdx}-${isActive}`}
              className={cn(
                'h-full bg-white origin-left',
                isActive
                  ? 'animate-seg-fill'
                  : '[animation-play-state:paused]',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
