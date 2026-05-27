'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Heart,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import Image from 'next/image';
import { FeedScroller } from './feed-scroller';
import type { BrowseProfile, BrowseResponse } from '../types';

function DesktopLeftPanel() {
  return (
    <div className="bg-white/80 backdrop-blur border border-[#ffe4e6] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-pink-400 fill-current" />
        <span className="text-sm font-bold strawberry-gradient">
          Strawberry Matcha
        </span>
      </div>
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-pink-50 border border-[#ffe4e6]">
        <Flame className="w-4 h-4 text-pink-400" />
        <span className="text-sm font-medium text-pink-600">For you</span>
      </div>
    </div>
  );
}

function DesktopRightPanel({
  profiles,
  scrollRef,
}: {
  profiles: BrowseProfile[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const scrollBy = (dir: number) => {
    const root = scrollRef.current;
    if (!root) return;
    root.scrollBy({ top: dir * root.clientHeight, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="bg-white/80 backdrop-blur border border-[#ffe4e6] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
          <Heart className="w-3.5 h-3.5 text-pink-400 fill-current" />
          Keyboard shortcuts
        </div>
        {[
          { keys: ['↑', '↓'], label: 'Browse' },
          { keys: ['L'], label: 'Like profile' },
          { keys: ['←', '→'], label: 'Carousel' },
        ].map(({ keys, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-[12px] text-gray-700"
          >
            {keys.map((k) => (
              <kbd
                key={k}
                className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded bg-gray-100 border border-gray-200 font-mono text-[11px] text-gray-700"
              >
                {k}
              </kbd>
            ))}
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur border border-[#ffe4e6] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
          <Heart className="w-3.5 h-3.5 text-pink-400 fill-current" />
          Tonight&apos;s matches
        </div>
        {profiles.slice(0, 4).map((p) => {
          const photo = p.photos?.[0] ?? p.previewPictureUrl ?? null;
          return (
            <div key={p.id} className="flex items-center gap-2.5 text-[13px]">
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-pink-100 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-pink-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-800 truncate">
                  {p.firstName}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-pink-400 fill-current" />
                  {Math.round(p.fameRating)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Previous profile"
          className="w-10 h-10 rounded-full bg-white border border-[#ffe4e6] text-gray-600 flex items-center justify-center hover:bg-pink-50 shadow-sm transition-colors cursor-pointer"
        >
          <ChevronUp className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Next profile"
          className="w-10 h-10 rounded-full bg-white border border-[#ffe4e6] text-gray-600 flex items-center justify-center hover:bg-pink-50 shadow-sm transition-colors cursor-pointer"
        >
          <ChevronDown className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}

function DiscoverEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4 strawberry-matcha-bg">
      <div className="w-20 h-20 rounded-full bg-white/80 backdrop-blur border border-[#ffe4e6] flex items-center justify-center">
        <Sparkles className="w-9 h-9 text-pink-400" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-gray-800">No profiles nearby</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Try widening your filters or check back later.
        </p>
      </div>
    </div>
  );
}

function DiscoverLoading() {
  return (
    <div className="flex items-center justify-center h-full strawberry-matcha-bg">
      <div className="flex flex-col items-center gap-3">
        <Heart className="w-10 h-10 text-pink-400 fill-current animate-pulse" />
        <p className="text-sm text-gray-500">Finding people near you…</p>
      </div>
    </div>
  );
}

interface DiscoverFeedProps {
  userId: string;
  viewerHasAvatar: boolean;
}

const PAGE_SIZE = 20;

export function DiscoverFeed({ userId, viewerHasAvatar }: DiscoverFeedProps) {
  const [profiles, setProfiles] = useState<BrowseProfile[]>([]);
  const [viewerInterests, setViewerInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState('');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);

  const seedLikedFromItems = useCallback((items: BrowseProfile[]) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      for (const p of items) {
        if (p.viewerLiked) next.add(p.id);
      }
      return next;
    });
  }, []);

  const loadPage = useCallback(
    async (targetPage: number) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const data = await apiClient.get<BrowseResponse>(
          `/users?page=${targetPage}&pageSize=${PAGE_SIZE}`,
        );
        const items = Array.isArray(data.items) ? data.items : [];
        setProfiles((prev) => (targetPage === 1 ? items : [...prev, ...items]));
        seedLikedFromItems(items);
        setHasMore(Boolean(data.hasMore));
        setPage(targetPage);
      } catch {
        if (targetPage === 1) setProfiles([]);
      } finally {
        inFlightRef.current = false;
      }
    },
    [seedLikedFromItems],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, profile] = await Promise.all([
          apiClient.get<BrowseResponse>(`/users?page=1&pageSize=${PAGE_SIZE}`),
          apiClient.get<{ interests: string[] | null }>(
            `/users/profiles/${userId}`,
          ),
        ]);
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setProfiles(items);
        seedLikedFromItems(items);
        setHasMore(Boolean(data.hasMore));
        setPage(1);
        setViewerInterests(
          Array.isArray(profile.interests) ? profile.interests : [],
        );
      } catch {
        if (!cancelled) setProfiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, seedLikedFromItems]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const onScroll = () => {
      if (!hasMore || inFlightRef.current) return;
      const remaining =
        root.scrollHeight - (root.scrollTop + root.clientHeight);
      if (remaining < root.clientHeight) {
        loadPage(page + 1);
      }
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [hasMore, page, loadPage]);

  const toggleLike = useCallback(
    async (profileId: string) => {
      const isLiked = likedIds.has(profileId);
      if (!isLiked && !viewerHasAvatar) {
        toast.info('Add a profile picture to like other profiles', {
          description: 'Head to your profile to upload one.',
        });
        return;
      }
      setLikedIds((s) => {
        const next = new Set(s);
        isLiked ? next.delete(profileId) : next.add(profileId);
        return next;
      });
      try {
        if (isLiked) {
          await apiClient.delete(`/users/${profileId}/likes`);
        } else {
          await apiClient.post(`/users/${profileId}/likes`);
        }
      } catch {
        setLikedIds((s) => {
          const next = new Set(s);
          isLiked ? next.add(profileId) : next.delete(profileId);
          return next;
        });
      }
    },
    [likedIds, viewerHasAvatar],
  );

  const handlePass = useCallback((profileId: string) => {
    setPassedIds((s) => new Set([...s, profileId]));
  }, []);

  const handleBlocked = useCallback((profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    setLikedIds((s) => {
      if (!s.has(profileId)) return s;
      const next = new Set(s);
      next.delete(profileId);
      return next;
    });
  }, []);

  const recordedViewsRef = useRef<Set<string>>(new Set());
  const handlePhotoView = useCallback((profileId: string) => {
    if (recordedViewsRef.current.has(profileId)) return;
    recordedViewsRef.current.add(profileId);
    apiClient.post(`/users/${profileId}/views`).catch(() => {
      recordedViewsRef.current.delete(profileId);
    });
  }, []);

  useHotkeys(
    'down',
    () => {
      scrollerRef.current?.scrollBy({
        top: scrollerRef.current.clientHeight,
        behavior: 'smooth',
      });
    },
    { preventDefault: true },
  );

  useHotkeys(
    'up',
    () => {
      scrollerRef.current?.scrollBy({
        top: -scrollerRef.current.clientHeight,
        behavior: 'smooth',
      });
    },
    { preventDefault: true },
  );

  useHotkeys('l', () => {
    if (activeId) toggleLike(activeId);
  });

  const visible = profiles.filter((p) => !passedIds.has(p.id));

  if (loading) return <DiscoverLoading />;
  if (visible.length === 0) return <DiscoverEmpty />;

  return (
    <div className="feed-viewport strawberry-matcha-bg flex">
      <div className="hidden md:flex flex-col justify-center p-8 w-72 shrink-0">
        <DesktopLeftPanel />
      </div>

      <div className="flex-1 relative feed-viewport">
        <FeedScroller
          profiles={visible}
          framed={false}
          likedIds={likedIds}
          viewerInterests={viewerInterests}
          viewerHasAvatar={viewerHasAvatar}
          onToggleLike={toggleLike}
          onPass={handlePass}
          onActiveChange={setActiveId}
          onPhotoView={handlePhotoView}
          onBlocked={handleBlocked}
          scrollRef={scrollerRef}
        />
      </div>

      <div className="hidden md:flex flex-col justify-center p-8 w-72 shrink-0">
        <DesktopRightPanel profiles={visible} scrollRef={scrollerRef} />
      </div>
    </div>
  );
}
