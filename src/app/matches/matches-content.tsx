'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Clock,
  HeartHandshake,
  MessageCircle,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { relativeTime } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import type { MatchEntry, PaginatedResult } from '@/server/types';

const PAGE_SIZE = 20;

function MatchCard({
  entry,
  onMessage,
  starting,
}: {
  entry: MatchEntry;
  onMessage: (userId: string) => void;
  starting: boolean;
}) {
  const initials =
    `${entry.firstName?.[0] ?? ''}${entry.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-[#ffe4e6] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <Link href={`/users/${entry.userId}`} className="relative aspect-[3/4] bg-pink-50 block">
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
            {initials || <UserIcon className="w-8 h-8" />}
          </div>
        )}
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm strawberry-matcha-btn text-white">
          <HeartHandshake className="w-3.5 h-3.5" />
        </div>
      </Link>
      <div className="px-3 py-2.5 flex flex-col gap-1.5">
        <Link href={`/users/${entry.userId}`} className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {entry.firstName} {entry.lastName}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Matched {relativeTime(entry.matchedAt)}
          </p>
        </Link>
        <button
          type="button"
          onClick={() => onMessage(entry.userId)}
          disabled={starting}
          className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg strawberry-matcha-btn text-white text-xs font-semibold h-8 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Message
        </button>
      </div>
    </div>
  );
}

export function MatchesContent({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<MatchEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startingWith, setStartingWith] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const router = useRouter();

  const endpoint = `/users/${userId}/matches`;

  const startConversation = useCallback(
    async (otherUserId: string) => {
      if (startingWith) return;
      setStartingWith(otherUserId);
      try {
        const { id } = await apiClient.post<{ id: string }>('/conversations', {
          userId: otherUserId,
        });
        router.push(`/messages/${id}`);
      } catch {
        toast.error('Could not start the conversation.');
        setStartingWith(null);
      }
    },
    [router, startingWith],
  );

  const loadMore = useCallback(
    async (targetPage: number) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const data = await apiClient.get<PaginatedResult<MatchEntry>>(
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
        const data = await apiClient.get<PaginatedResult<MatchEntry>>(
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
      (observed) => {
        if (observed[0]?.isIntersecting && !inFlightRef.current) {
          loadMore(page + 1);
        }
      },
      { rootMargin: '160px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, page, loadMore]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold strawberry-matcha-gradient tracking-tight">
          Your Matches
        </h1>
        <p className="text-sm text-gray-500">People you and they both liked.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <HeartHandshake className="w-10 h-10" />
          <p className="text-sm text-center max-w-[220px]">
            No matches yet. Keep browsing and like profiles to find your match.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {entries.map((entry) => (
            <MatchCard
              key={entry.userId}
              entry={entry}
              onMessage={startConversation}
              starting={startingWith === entry.userId}
            />
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="col-span-full h-8" aria-hidden />
          )}
        </div>
      )}
    </div>
  );
}
