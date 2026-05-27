'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FeedCard } from './feed-card';
import type { BrowseProfile } from '../types';

interface FeedScrollerProps {
  profiles: BrowseProfile[];
  framed: boolean;
  likedIds: Set<string>;
  viewerInterests: string[];
  viewerHasAvatar: boolean;
  onToggleLike: (id: string) => void;
  onPass: (id: string) => void;
  onActiveChange?: (id: string) => void;
  onPhotoView?: (id: string) => void;
  onBlocked?: (id: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function FeedScroller({
  profiles,
  framed,
  likedIds,
  viewerInterests,
  viewerHasAvatar,
  onToggleLike,
  onPass,
  onActiveChange,
  onPhotoView,
  onBlocked,
  scrollRef,
}: FeedScrollerProps) {
  const [activeId, setActiveId] = useState(profiles[0]?.id ?? '');

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const id = e.target.getAttribute('data-id') ?? '';
            setActiveId(id);
            onActiveChange?.(id);
          }
        });
      },
      { root, threshold: [0.6, 0.9] },
    );
    root.querySelectorAll('[data-feed-slot]').forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [profiles.length, onActiveChange, scrollRef]);

  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-y-scroll"
      style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
    >
      {profiles.map((p) => (
        <div
          key={p.id}
          data-feed-slot
          data-id={p.id}
          className={cn(
            'h-full w-full',
            framed && 'flex items-center justify-center',
          )}
          style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
        >
          {framed ? (
            <div
              className="relative rounded-[18px] overflow-hidden"
              style={{ height: 'min(95%, 760px)', aspectRatio: '9 / 16' }}
            >
              <FeedCard
                profile={p}
                isActive={activeId === p.id}
                isLiked={likedIds.has(p.id)}
                framed
                viewerInterests={viewerInterests}
                viewerHasAvatar={viewerHasAvatar}
                onLike={onToggleLike}
                onPass={onPass}
                onPhotoView={onPhotoView}
                onBlocked={onBlocked}
              />
            </div>
          ) : (
            <FeedCard
              profile={p}
              isActive={activeId === p.id}
              isLiked={likedIds.has(p.id)}
              framed={false}
              viewerInterests={viewerInterests}
              viewerHasAvatar={viewerHasAvatar}
              onLike={onToggleLike}
              onPass={onPass}
              onPhotoView={onPhotoView}
              onBlocked={onBlocked}
            />
          )}
        </div>
      ))}
    </div>
  );
}
