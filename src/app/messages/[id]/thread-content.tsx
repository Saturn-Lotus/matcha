'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, SendHorizontal, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/stores/chat-store';
import {
  connectSocket,
  emitMarkRead,
  emitSendMessage,
} from '@/lib/socket-client';
import { MESSAGE_BODY_MAX } from '@/server/schemas';
import type {
  ConversationMeta,
  MessageDTO,
  MessagesPage,
} from '@/server/types';

const PAGE_LIMIT = 30;
const NEAR_BOTTOM_PX = 120;

const SEND_ERROR_MESSAGES: Record<string, string> = {
  NO_LONGER_CONNECTED: 'You are no longer connected with this user.',
  NOT_A_PARTICIPANT: 'You are not part of this conversation.',
  MESSAGE_TOO_LONG: `Messages can be at most ${MESSAGE_BODY_MAX} characters.`,
  INVALID_PAYLOAD: 'Your message could not be sent.',
  INTERNAL_ERROR: 'Something went wrong sending your message.',
};

export function ThreadContent({
  userId,
  conversationId,
}: {
  userId: string;
  conversationId: string;
}) {
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [disabled, setDisabled] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingOlderRef = useRef(false);
  const prependHeightRef = useRef<number | null>(null);

  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const markReadLocal = useChatStore((s) => s.markReadLocal);

  const isNearBottom = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return true;
    return (
      node.scrollHeight - node.scrollTop - node.clientHeight < NEAR_BOTTOM_PX
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, []);

  const appendMessage = useCallback((message: MessageDTO) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setActiveConversation(conversationId);
    (async () => {
      try {
        const [metaData, page] = await Promise.all([
          apiClient.get<ConversationMeta>(`/conversations/${conversationId}`),
          apiClient.get<MessagesPage>(
            `/conversations/${conversationId}/messages?limit=${PAGE_LIMIT}`,
          ),
        ]);
        if (cancelled) return;
        setMeta(metaData);
        setDisabled(!metaData.connected);
        setMessages([...page.items].reverse());
        setNextCursor(page.nextCursor);
        emitMarkRead(conversationId);
        markReadLocal(conversationId);
      } catch {
        if (!cancelled) toast.error('Could not load this conversation.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation, markReadLocal]);

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [loading, scrollToBottom]);

  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current || !nextCursor) return;
    loadingOlderRef.current = true;
    const node = scrollRef.current;
    prependHeightRef.current = node?.scrollHeight ?? null;
    try {
      const page = await apiClient.get<MessagesPage>(
        `/conversations/${conversationId}/messages?limit=${PAGE_LIMIT}&cursor=${encodeURIComponent(nextCursor)}`,
      );
      setMessages((prev) => [...[...page.items].reverse(), ...prev]);
      setNextCursor(page.nextCursor);
    } catch {
      // leave cursor in place; user can retry by scrolling
    } finally {
      loadingOlderRef.current = false;
    }
  }, [conversationId, nextCursor]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    const before = prependHeightRef.current;
    if (node && before !== null) {
      node.scrollTop = node.scrollHeight - before;
      prependHeightRef.current = null;
    }
  }, [messages]);

  useEffect(() => {
    const node = topSentinelRef.current;
    if (!node || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadOlder();
      },
      { rootMargin: '120px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nextCursor, loadOlder]);

  useEffect(() => {
    const socket = connectSocket();
    const onCreated = (message: MessageDTO) => {
      if (message.conversationId !== conversationId) return;
      const stick = isNearBottom();
      appendMessage(message);
      if (message.senderId !== userId) {
        emitMarkRead(conversationId);
        markReadLocal(conversationId);
      }
      if (stick || message.senderId === userId) {
        requestAnimationFrame(scrollToBottom);
      }
    };
    socket.on('message:created', onCreated);
    return () => {
      socket.off('message:created', onCreated);
    };
  }, [
    conversationId,
    userId,
    appendMessage,
    isNearBottom,
    scrollToBottom,
    markReadLocal,
  ]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || disabled) return;
    setDraft('');
    const ack = await emitSendMessage(conversationId, body);
    if ('error' in ack) {
      if (ack.error === 'NO_LONGER_CONNECTED') setDisabled(true);
      toast.error(SEND_ERROR_MESSAGES[ack.error] ?? SEND_ERROR_MESSAGES.INTERNAL_ERROR);
      setDraft(body);
      return;
    }
    appendMessage(ack.message);
    requestAnimationFrame(scrollToBottom);
  }, [draft, disabled, conversationId, appendMessage, scrollToBottom]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const other = meta?.otherUser;
  const initials =
    `${other?.firstName?.[0] ?? ''}${other?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col h-[calc(100vh-7rem)] px-4 py-4">
      <header className="flex items-center gap-3 pb-3 border-b border-[#ffe4e6]">
        <Link
          href="/messages"
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Link
          href={other ? `/users/${other.userId}` : '#'}
          className="flex items-center gap-3 min-w-0"
        >
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-pink-50 shrink-0">
            {other?.avatarUrl ? (
              <Image
                src={other.avatarUrl}
                alt={other.firstName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-pink-300">
                {initials || <UserIcon className="w-4 h-4" />}
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {other ? `${other.firstName} ${other.lastName}` : 'Conversation'}
          </p>
        </Link>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 flex flex-col gap-2"
      >
        {nextCursor && <div ref={topSentinelRef} className="h-1" aria-hidden />}
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-9 rounded-2xl bg-gray-100 animate-pulse',
                  i % 2 === 0 ? 'self-start w-40' : 'self-end w-32',
                )}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            No messages yet. Say hi 👋
          </div>
        ) : (
          messages.map((message) => {
            const own = message.senderId === userId;
            return (
              <div
                key={message.id}
                className={cn(
                  'max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words',
                  own
                    ? 'self-end strawberry-matcha-btn text-white rounded-br-md'
                    : 'self-start bg-gray-100 text-gray-800 rounded-bl-md',
                )}
              >
                {message.body}
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 border-t border-[#ffe4e6]">
        {disabled && (
          <p className="text-xs text-gray-400 text-center pb-2">
            You can no longer message this user.
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            rows={1}
            maxLength={MESSAGE_BODY_MAX}
            placeholder={disabled ? 'Messaging disabled' : 'Type a message…'}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-pink-300 disabled:bg-gray-50 disabled:text-gray-400 max-h-32"
          />
          <button
            type="button"
            onClick={send}
            disabled={disabled || draft.trim().length === 0}
            aria-label="Send message"
            className="w-10 h-10 shrink-0 rounded-full strawberry-matcha-btn text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
