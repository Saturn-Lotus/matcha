'use client';

import { useEffect, useState } from 'react';
import { Clock, Eye, Heart } from 'lucide-react';
import Image from 'next/image';
import { cn, relativeTime } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

interface SocialEntry {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  viewedAt?: string;
  likedAt?: string;
}

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
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-[#ffe4e6] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
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
    </div>
  );
}

interface SocialGridProps {
  userId: string;
  type: 'view' | 'like';
}

export function SocialGrid({ userId, type }: SocialGridProps) {
  const [entries, setEntries] = useState<SocialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const endpoint =
    type === 'view'
      ? `/users/${userId}/views`
      : `/users/${userId}/likes`;

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<SocialEntry[]>(endpoint);
        setEntries(Array.isArray(data) ? data : []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [endpoint]);

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
      {entries.map((entry, i) => (
        <SocialCard key={i} entry={entry} type={type} />
      ))}
    </div>
  );
}
