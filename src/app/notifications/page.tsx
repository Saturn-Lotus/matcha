'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Heart,
  Eye,
  MessageCircle,
  HeartHandshake,
  HeartCrack,
  CheckCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { relativeTime, formatDayLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { NotificationDTO, NotificationType } from '@/server/types';

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-pink-500" />,
  profile_view: <Eye className="w-4 h-4 text-purple-500" />,
  message: <MessageCircle className="w-4 h-4 text-blue-500" />,
  match: <HeartHandshake className="w-4 h-4 text-emerald-500" />,
  unmatch: <HeartCrack className="w-4 h-4 text-gray-400" />,
};

function notificationText(n: NotificationDTO): string {
  const name = `${n.actorFirstName} ${n.actorLastName}`.trim();
  switch (n.type) {
    case 'like':
      return `${name} liked your profile`;
    case 'profile_view':
      return `${name} viewed your profile`;
    case 'message':
      return `${name} sent you a message`;
    case 'match':
      return `You and ${name} are now connected!`;
    case 'unmatch':
      return `${name} disconnected from you`;
  }
}

function notificationHref(n: NotificationDTO): string | null {
  switch (n.type) {
    case 'like':
    case 'profile_view':
    case 'unmatch':
      return `/users/${n.actorId}`;
    case 'message':
      return n.payload?.conversationId
        ? `/messages/${n.payload.conversationId}`
        : '/messages';
    case 'match':
      return '/matches';
  }
}

function groupByDay(items: NotificationDTO[]): [string, NotificationDTO[]][] {
  const map = new Map<string, NotificationDTO[]>();
  for (const n of items) {
    const label = formatDayLabel(n.createdAt);
    const group = map.get(label) ?? [];
    group.push(n);
    map.set(label, group);
  }
  return Array.from(map.entries());
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const initialFetched = useRef(false);

  const fetchPage = useCallback(async (cursor: string | null) => {
    const params = new URLSearchParams({ limit: '20' });
    if (cursor) params.set('cursor', cursor);
    const data = await apiClient.get<{
      items: NotificationDTO[];
      nextCursor: string | null;
    }>(`/notifications?${params}`);
    return data;
  }, []);

  useEffect(() => {
    if (initialFetched.current) return;
    initialFetched.current = true;

    const loadInitial = async () => {
      try {
        const data = await fetchPage(null);
        setItems(data.items);
        setNextCursor(data.nextCursor);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [fetchPage]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(nextCursor);
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAllRead = async () => {
    clearAll();
    await apiClient.post('/notifications/read', { ids: [] });
  };

  const groups = groupByDay(items);

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-pink-500 hover:text-pink-600 font-medium transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([label, group]) => (
            <div key={label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {label}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {group.map((n) => {
                  const href = notificationHref(n);
                  const inner = (
                    <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                      <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {TYPE_ICON[n.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-snug">
                          {notificationText(n)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                  return href ? (
                    <Link key={n.id} href={href} className="block">
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id}>{inner}</div>
                  );
                })}
              </div>
            </div>
          ))}

          {nextCursor && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className={cn(
                  'text-sm text-gray-500 hover:text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors',
                  loadingMore && 'opacity-50 cursor-not-allowed',
                )}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
