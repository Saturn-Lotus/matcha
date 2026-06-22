'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/stores/chat-store';
import type { ConversationListItem } from '@/server/types';
import { Inbox } from './inbox';
import { ThreadPane } from './thread-pane';

function idFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/messages\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function Messenger({
  userId,
  initialConversationId,
}: {
  userId: string;
  initialConversationId: string | null;
}) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversationId,
  );
  const [inThread, setInThread] = useState<boolean>(!!initialConversationId);

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
        setActiveId((cur) => cur ?? items[0]?.id ?? null);
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

  useEffect(() => {
    const onPop = () => {
      const id = idFromPath(window.location.pathname);
      setActiveId((cur) => id ?? cur);
      setInThread(!!id);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const select = useCallback((id: string) => {
    setActiveId(id);
    setInThread(true);
    window.history.pushState(null, '', `/messages/${id}`);
  }, []);

  const back = useCallback(() => {
    setInThread(false);
    window.history.pushState(null, '', '/messages');
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  );

  const isEmpty = !loading && conversations.length === 0;

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col">
      <div className="flex-1 min-h-0 w-full max-w-[1040px] mx-auto px-3 sm:px-4 pt-2 pb-4 flex">
        <div className="w-full h-[calc(100dvh-10.5rem)] min-h-[460px] grid grid-cols-1 md:grid-cols-[332px_1fr] rounded-2xl border border-card-border bg-white/70 backdrop-blur-md shadow-lg overflow-hidden">
          <div
            className={cn(
              'min-h-0 h-full',
              inThread ? 'hidden md:block' : 'block',
            )}
          >
            <Inbox
              conversations={conversations}
              userId={userId}
              unreadByConversation={unreadByConversation}
              activeId={activeId}
              onSelect={select}
            />
          </div>

          <div
            className={cn(
              'min-h-0 h-full',
              inThread ? 'block' : 'hidden md:block',
            )}
          >
            {isEmpty ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-10">
                <div className="w-16 h-16 rounded-full strawberry-matcha-btn grid place-items-center shadow-lg shadow-pink-100">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  No conversations yet
                </h3>
                <p className="max-w-[260px] text-sm text-gray-500">
                  Like someone back and start brewing a sweet connection.
                </p>
                <Link
                  href="/browse"
                  className="px-5 py-2.5 rounded-full strawberry-matcha-btn text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Find matches
                </Link>
              </div>
            ) : activeId ? (
              <ThreadPane
                key={activeId}
                userId={userId}
                conversationId={activeId}
                listItem={activeConversation}
                onBack={back}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-10">
                <div className="w-16 h-16 rounded-full strawberry-matcha-btn grid place-items-center shadow-lg shadow-pink-100">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Pick a conversation
                </h3>
                <p className="max-w-[240px] text-sm text-gray-500">
                  Choose a match on the left to start chatting.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
