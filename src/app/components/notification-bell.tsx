'use client';

import {
  Bell,
  Heart,
  Eye,
  MessageCircle,
  HeartHandshake,
  HeartCrack,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { apiClient } from '@/lib/api';
import { relativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { NotificationDTO, NotificationType } from '@/server/types';

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

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  like: <Heart className="w-3.5 h-3.5 text-pink-500" />,
  profile_view: <Eye className="w-3.5 h-3.5 text-purple-500" />,
  message: <MessageCircle className="w-3.5 h-3.5 text-blue-500" />,
  match: <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />,
  unmatch: <HeartCrack className="w-3.5 h-3.5 text-gray-400" />,
};

function NotificationItem({ n }: { n: NotificationDTO }) {
  const href = notificationHref(n);
  const content = (
    <div className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors">
      <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
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

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

export function NotificationBell() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const recent = useNotificationStore((s) => s.recent);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const handleMarkAllRead = async () => {
    clearAll();
    try {
      await apiClient.post('/notifications/read', { ids: [] });
    } catch {
      // optimistic — badge already cleared locally
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all duration-150 focus:outline-none"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[9px] font-bold rounded-full text-white strawberry-matcha-btn leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-80 rounded-xl border border-gray-200/80 shadow-lg shadow-black/5 bg-white p-1.5"
      >
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <span className="text-sm font-semibold text-gray-800">
            Notifications
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-gray-400">
            No notifications yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {recent.map((n) => (
              <NotificationItem key={n.id} n={n} />
            ))}
          </div>
        )}

        <div
          className={cn(
            'mt-1 pt-1 border-t border-gray-100',
            recent.length === 0 && 'border-t-0 mt-0 pt-0',
          )}
        >
          <Link
            href="/notifications"
            className="block text-center text-xs text-gray-500 hover:text-gray-800 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            See all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
