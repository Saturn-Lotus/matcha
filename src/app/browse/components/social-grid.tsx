'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Eye, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn, relativeTime } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

interface SocialEntry {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  viewedAt?: string;
  likedAt?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

function SocialCard({
  entry,
  type,
}: {
  entry: SocialEntry;
  type: 'view' | 'like';
}) {
  const timestamp = entry.viewedAt ?? entry.likedAt;
  const initials =
    `${entry.firstName?.[0] ?? ''}${entry.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <Link href={`/users/${entry.userId}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-[#ffe4e6] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="relative aspect-[3/4] bg-pink-50">
        {entry.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt={entry.firstName}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-pink-300">
            {initials}
          </div>
        )}
        <div
          className={cn(
            'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm',
            type === 'like'
              ? 'bg-pink-500 text-white'
              : 'bg-white/90 text-gray-500',
          )}
        >
          {type === 'like' ? (
            <Heart className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
      <div className="px-3 py-2.5 flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {entry.firstName} {entry.lastName}
        </p>
        {timestamp && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {relativeTime(timestamp)}
          </p>
        )}
      </div>
    </Link>
  );
}

interface SocialGridProps {
  userId: string;
  type: 'view' | 'like';
}

export function SocialGrid({ userId, type }: SocialGridProps) {
  const [entries, setEntries] = useState<SocialEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);

  const endpoint =
    type === 'view' ? `/users/${userId}/views` : `/users/${userId}/likes`;

  const loadMore = useCallback(
    async (targetPage: number) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const data = await apiClient.get<PaginatedResponse<SocialEntry>>(
          `${endpoint}?page=${targetPage}&pageSize=${PAGE_SIZE}`,
        );
        const items = Array.isArray(data.items) ? data.items : [];
        setEntries((prev) => [...prev, ...items]);
        setHasMore(Boolean(data.hasMore));
        setPage(targetPage);
      } finally {
        inFlightRef.current = false;
      }
    },
    [endpoint],
  );

  useEffect(() => {
    let cancelled = false;
    inFlightRef.current = true;
    (async () => {
      try {
        const data = await apiClient.get<PaginatedResponse<SocialEntry>>(
          `${endpoint}?page=1&pageSize=${PAGE_SIZE}`,
        );
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setEntries(items);
        setHasMore(Boolean(data.hasMore));
        setPage(1);
      } catch {
        if (!cancelled) {
          setEntries([]);
          setHasMore(false);
        }
      } finally {
        inFlightRef.current = false;
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !inFlightRef.current) {
          loadMore(page + 1);
        }
      },
      { rootMargin: '160px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, page, loadMore]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        {type === 'view' ? (
          <Eye className="w-10 h-10" />
        ) : (
          <Heart className="w-10 h-10" />
        )}
        <p className="text-sm text-center max-w-[200px]">
          {type === 'view'
            ? 'No one has visited your profile yet'
            : "You haven't received any likes yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {entries.map((entry) => (
        <SocialCard key={entry.userId} entry={entry} type={type} />
      ))}
      {hasMore && (
        <div ref={sentinelRef} className="col-span-full h-8" aria-hidden />
      )}
    </div>
  );
}
