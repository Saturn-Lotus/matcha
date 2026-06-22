'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, User as UserIcon } from 'lucide-react';
import { cn, relativeTime } from '@/lib/utils';
import type { ConversationListItem } from '@/server/types';

function ConvRow({
  conversation,
  userId,
  unreadCount,
  active,
  onSelect,
}: {
  conversation: ConversationListItem;
  userId: string;
  unreadCount: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { otherUser, lastMessage } = conversation;
  const initials =
    `${otherUser.firstName?.[0] ?? ''}${otherUser.lastName?.[0] ?? ''}`.toUpperCase();
  const hasUnread = unreadCount > 0;
  const preview = lastMessage
    ? `${lastMessage.senderId === userId ? 'You: ' : ''}${lastMessage.body}`
    : 'Say hi and break the ice';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200',
        active
          ? 'bg-white border-card-border shadow-md'
          : 'border-transparent hover:-translate-y-px hover:bg-white hover:shadow-md',
      )}
    >
      <span className="relative shrink-0 w-[46px] h-[46px]">
        <span
          className={cn(
            'block relative w-[46px] h-[46px] rounded-full overflow-hidden bg-pink-50 ring-2 transition-all duration-200',
            active
              ? 'ring-pink-200'
              : 'ring-transparent group-hover:ring-pink-200',
          )}
        >
          {otherUser.avatarUrl ? (
            <Image
              src={otherUser.avatarUrl}
              alt={otherUser.firstName}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-sm font-bold text-pink-400">
              {initials || <UserIcon className="w-5 h-5" />}
            </span>
          )}
        </span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[19px] h-[19px] px-1.5 text-[11px] font-bold leading-none text-white rounded-full border-2 border-white strawberry-matcha-btn">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              'text-sm truncate',
              hasUnread
                ? 'font-bold text-gray-900'
                : 'font-semibold text-gray-800',
            )}
          >
            {otherUser.firstName} {otherUser.lastName}
          </span>
          {lastMessage && (
            <span
              className={cn(
                'text-[11px] shrink-0 tabular-nums',
                hasUnread ? 'text-pink-500 font-medium' : 'text-gray-400',
              )}
            >
              {relativeTime(lastMessage.createdAt)}
            </span>
          )}
        </span>
        <span
          className={cn(
            'block text-xs truncate mt-0.5',
            hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400',
          )}
        >
          {preview}
        </span>
      </span>
    </button>
  );
}

export function Inbox({
  conversations,
  userId,
  unreadByConversation,
  activeId,
  onSelect,
}: {
  conversations: ConversationListItem[];
  userId: string;
  unreadByConversation: Record<string, number>;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = conversations.filter((c) =>
    `${c.otherUser.firstName} ${c.otherUser.lastName}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const totalUnread = conversations.reduce(
    (n, c) => n + ((unreadByConversation[c.id] ?? c.unreadCount) > 0 ? 1 : 0),
    0,
  );

  return (
    <div className="flex flex-col min-h-0 h-full border-r border-border-light bg-white/50">
      <div className="px-[18px] pt-[18px] pb-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-bold tracking-tight strawberry-matcha-gradient">
            Messages
          </h1>
          {totalUnread > 0 && (
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap shrink-0">
              {totalUnread} unread
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Sweet conversations with the people you&apos;ve matched.
        </p>
      </div>
      <div className="mx-[18px] mb-1.5 flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-border">
        <Search className="w-[15px] h-[15px] text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-gray-800 placeholder:text-gray-400"
        />
      </div>
      <div className="sm-scroll flex-1 min-h-0 overflow-y-auto px-3 pb-3 pt-1.5 flex flex-col gap-1">
        {filtered.map((c) => (
          <ConvRow
            key={c.id}
            conversation={c}
            userId={userId}
            unreadCount={unreadByConversation[c.id] ?? c.unreadCount}
            active={c.id === activeId}
            onSelect={() => onSelect(c.id)}
          />
        ))}
        {conversations.length > 0 && filtered.length === 0 && (
          <p className="text-center text-gray-400 text-[13px] py-6 px-2">
            No conversations match “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}
