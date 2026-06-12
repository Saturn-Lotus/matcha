'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, User as UserIcon } from 'lucide-react';
import { relativeTime } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/stores/chat-store';
import type { ConversationListItem } from '@/server/types';

function ConversationRow({
  conversation,
  userId,
  unreadCount,
}: {
  conversation: ConversationListItem;
  userId: string;
  unreadCount: number;
}) {
  const { otherUser, lastMessage } = conversation;
  const initials =
    `${otherUser.firstName?.[0] ?? ''}${otherUser.lastName?.[0] ?? ''}`.toUpperCase();
  const preview = lastMessage
    ? `${lastMessage.senderId === userId ? 'You: ' : ''}${lastMessage.body}`
    : 'Say hi 👋';

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white border border-[#ffe4e6] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-pink-50 shrink-0">
        {otherUser.avatarUrl ? (
          <Image
            src={otherUser.avatarUrl}
            alt={otherUser.firstName}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-pink-300">
            {initials || <UserIcon className="w-5 h-5" />}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {otherUser.firstName} {otherUser.lastName}
          </p>
          {lastMessage && (
            <span className="text-[11px] text-gray-400 shrink-0">
              {relativeTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p
          className={cn(
            'text-xs truncate mt-0.5',
            unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-400',
          )}
        >
          {preview}
        </p>
      </div>
      {unreadCount > 0 && (
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold rounded-full text-white strawberry-matcha-btn leading-none shrink-0">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

export function MessagesContent({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadByConversation = useChatStore((s) => s.unreadByConversation);
  const setConversationUnreads = useChatStore((s) => s.setConversationUnreads);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data =
          await apiClient.get<ConversationListItem[]>('/conversations');
        if (cancelled) return;
        const items = Array.isArray(data) ? data : [];
        setConversations(items);
        const map: Record<string, number> = {};
        for (const c of items) {
          if (c.unreadCount > 0) map[c.id] = c.unreadCount;
        }
        setConversationUnreads(map);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setConversationUnreads]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold strawberry-matcha-gradient tracking-tight">
          Messages
        </h1>
        <p className="text-sm text-gray-500">Your conversations with matches.</p>
      </header>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <MessageCircle className="w-10 h-10" />
          <p className="text-sm text-center max-w-[240px]">
            No conversations yet. Start chatting with one of your matches.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              userId={userId}
              unreadCount={
                unreadByConversation[conversation.id] ??
                conversation.unreadCount
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
