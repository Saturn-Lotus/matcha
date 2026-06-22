'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Heart,
  Loader2,
  MoreHorizontal,
  SendHorizontal,
  Smile,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import {
  cn,
  formatClockTime,
  formatCompactNumber,
  formatDayLabel,
  relativeTime,
} from '@/lib/utils';
import { useChatStore } from '@/lib/stores/chat-store';
import {
  connectSocket,
  emitMarkRead,
  emitSendMessage,
  emitTyping,
} from '@/lib/socket-client';
import { MESSAGE_BODY_MAX } from '@/server/schemas';
import type {
  ConversationListItem,
  ConversationMeta,
  MessageDTO,
  MessagesPage,
  PublicProfile,
} from '@/server/types';

const PAGE_LIMIT = 30;
const NEAR_BOTTOM_PX = 120;
const TYPING_IDLE_MS = 2500;
const TYPING_PEER_TIMEOUT_MS = 6000;

const SEND_ERROR_MESSAGES: Record<string, string> = {
  NO_LONGER_CONNECTED: 'You are no longer connected with this user.',
  NOT_A_PARTICIPANT: 'You are not part of this conversation.',
  MESSAGE_TOO_LONG: `Messages can be at most ${MESSAGE_BODY_MAX} characters.`,
  INVALID_PAYLOAD: 'Your message could not be sent.',
  INTERNAL_ERROR: 'Something went wrong sending your message.',
};

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

type ChatMessage = MessageDTO & {
  clientId?: string;
  status: MessageStatus;
};

function toChatMessage(dto: MessageDTO, userId: string): ChatMessage {
  const status: MessageStatus =
    dto.readAt && dto.senderId === userId ? 'read' : 'sent';
  return { ...dto, status };
}

function ReadIcon({ status }: { status: MessageStatus }) {
  if (status === 'sending')
    return <Loader2 className="w-3 h-3 animate-spin text-gray-300" />;
  if (status === 'sent') return <Check className="w-3.5 h-3.5 text-gray-300" />;
  if (status === 'delivered')
    return <CheckCheck className="w-3.5 h-3.5 text-gray-300" />;
  return <CheckCheck className="w-3.5 h-3.5 text-green-500" />;
}

export function ThreadPane({
  userId,
  conversationId,
  listItem,
  onBack,
}: {
  userId: string;
  conversationId: string;
  listItem?: ConversationListItem;
  onBack: () => void;
}) {
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingOlderRef = useRef(false);
  const prependHeightRef = useRef<number | null>(null);
  const typingActiveRef = useRef(false);
  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const markReadLocal = useChatStore((s) => s.markReadLocal);

  const other = meta?.otherUser;
  const otherUserId = other?.userId ?? listItem?.otherUser.userId;
  const headerName = other
    ? `${other.firstName} ${other.lastName}`
    : listItem
      ? `${listItem.otherUser.firstName} ${listItem.otherUser.lastName}`
      : 'Conversation';
  const headerAvatar =
    other?.avatarUrl ?? listItem?.otherUser.avatarUrl ?? null;
  const initials = headerName
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

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

  const upsertMessage = useCallback(
    (incoming: MessageDTO) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === incoming.id);
        if (idx !== -1) {
          const cur = prev[idx];
          const nextStatus =
            incoming.readAt && incoming.senderId === userId
              ? 'read'
              : cur.status;
          const next = [...prev];
          next[idx] = { ...cur, ...incoming, status: nextStatus };
          return next;
        }
        if (incoming.senderId === userId) {
          const pendingIdx = prev.findIndex(
            (m) => m.status === 'sending' && m.body === incoming.body,
          );
          if (pendingIdx !== -1) {
            const next = [...prev];
            next[pendingIdx] = { ...incoming, status: 'sent' };
            return next;
          }
        }
        return [...prev, toChatMessage(incoming, userId)];
      });
    },
    [userId],
  );

  useEffect(() => {
    let cancelled = false;
    setActiveConversation(conversationId);
    setLoading(true);
    setMessages([]);
    setMeta(null);
    setProfile(null);
    setNextCursor(null);
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
        setMessages(
          [...page.items].reverse().map((m) => toChatMessage(m, userId)),
        );
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
  }, [conversationId, setActiveConversation, markReadLocal, userId]);

  useEffect(() => {
    if (!otherUserId) return;
    let cancelled = false;
    apiClient
      .get<PublicProfile>(`/users/${otherUserId}`)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        // stats are decorative — a fetch miss just hides them
      });
    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

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
      setMessages((prev) => [
        ...[...page.items].reverse().map((m) => toChatMessage(m, userId)),
        ...prev,
      ]);
      setNextCursor(page.nextCursor);
    } catch {
      // leave cursor in place; user can retry by scrolling
    } finally {
      loadingOlderRef.current = false;
    }
  }, [conversationId, nextCursor, userId]);

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
      upsertMessage(message);
      if (message.senderId !== userId) {
        emitMarkRead(conversationId);
        markReadLocal(conversationId);
      }
      if (stick || message.senderId === userId) {
        requestAnimationFrame(scrollToBottom);
      }
    };

    const onDelivered = (payload: { conversationId: string }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === userId && m.status === 'sent'
            ? { ...m, status: 'delivered' }
            : m,
        ),
      );
    };

    const onRead = (payload: { conversationId: string; readerId: string }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.readerId !== otherUserId) return;
      const readAt = new Date().toISOString();
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === userId && m.status !== 'read'
            ? { ...m, status: 'read', readAt }
            : m,
        ),
      );
    };

    const onTyping = (payload: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId !== otherUserId) return;
      if (peerTypingTimerRef.current) clearTimeout(peerTypingTimerRef.current);
      if (payload.isTyping) {
        setPeerTyping(true);
        peerTypingTimerRef.current = setTimeout(
          () => setPeerTyping(false),
          TYPING_PEER_TIMEOUT_MS,
        );
      } else {
        setPeerTyping(false);
      }
    };

    socket.on('message:created', onCreated);
    socket.on('message:delivered', onDelivered);
    socket.on('message:read', onRead);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:created', onCreated);
      socket.off('message:delivered', onDelivered);
      socket.off('message:read', onRead);
      socket.off('typing', onTyping);
      setPeerTyping(false);
    };
  }, [
    conversationId,
    userId,
    otherUserId,
    upsertMessage,
    isNearBottom,
    scrollToBottom,
    markReadLocal,
  ]);

  useEffect(() => {
    if (peerTyping && isNearBottom()) requestAnimationFrame(scrollToBottom);
  }, [peerTyping, isNearBottom, scrollToBottom]);

  const stopTyping = useCallback(() => {
    if (typingIdleTimerRef.current) {
      clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = null;
    }
    if (typingActiveRef.current) {
      typingActiveRef.current = false;
      emitTyping(conversationId, false);
    }
  }, [conversationId]);

  const pingTyping = useCallback(() => {
    if (disabled) return;
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      emitTyping(conversationId, true);
    }
    if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [conversationId, disabled, stopTyping]);

  useEffect(() => stopTyping, [stopTyping]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || disabled) return;
    const clientId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `tmp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: clientId,
      clientId,
      conversationId,
      senderId: userId,
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
      status: 'sending',
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    stopTyping();
    requestAnimationFrame(scrollToBottom);

    const ack = await emitSendMessage(conversationId, body);
    if ('error' in ack) {
      setMessages((prev) => prev.filter((m) => m.id !== clientId));
      if (ack.error === 'NO_LONGER_CONNECTED') setDisabled(true);
      toast.error(
        SEND_ERROR_MESSAGES[ack.error] ?? SEND_ERROR_MESSAGES.INTERNAL_ERROR,
      );
      setDraft(body);
      return;
    }
    setMessages((prev) => {
      if (prev.some((m) => m.id === ack.message.id)) {
        return prev.filter((m) => m.id !== clientId);
      }
      return prev.map((m) =>
        m.id === clientId ? { ...ack.message, clientId, status: 'sent' } : m,
      );
    });
  }, [draft, disabled, conversationId, userId, scrollToBottom, stopTyping]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const days = useMemo(() => {
    const groups: { key: string; label: string; msgs: ChatMessage[] }[] = [];
    for (const m of messages) {
      const d = new Date(m.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.msgs.push(m);
      else groups.push({ key, label: formatDayLabel(m.createdAt), msgs: [m] });
    }
    return groups;
  }, [messages]);

  const isOnline = profile?.isOnline ?? false;
  const presence = isOnline
    ? 'Active now'
    : profile?.lastSeenAt
      ? `Active ${relativeTime(profile.lastSeenAt)}`
      : 'Offline';

  return (
    <div className="flex flex-col min-h-0 min-w-0 h-full">
      <header className="flex items-center gap-3 px-4 sm:px-[18px] py-3.5 border-b border-card-border bg-white/55">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="md:hidden w-[34px] h-[34px] shrink-0 grid place-items-center rounded-md text-gray-400 hover:bg-pink-50 hover:text-pink-500 transition-colors"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <Link
          href={otherUserId ? `/users/${otherUserId}` : '#'}
          className="flex items-center gap-3 min-w-0 flex-1 group"
        >
          <span className="relative shrink-0">
            <span className="block relative w-[42px] h-[42px] rounded-full overflow-hidden bg-pink-50 ring-2 ring-pink-100">
              {headerAvatar ? (
                <Image
                  src={headerAvatar}
                  alt={headerName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-xs font-bold text-pink-400">
                  {initials || <UserIcon className="w-4 h-4" />}
                </span>
              )}
            </span>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full bg-green-400 border-2 border-white" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold text-gray-800 truncate">
              {headerName}
            </span>
            <span
              className={cn(
                'block text-[11px] truncate',
                isOnline ? 'text-green-600 font-medium' : 'text-gray-400',
              )}
            >
              {presence}
            </span>
          </span>
        </Link>
        {profile && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              {formatCompactNumber(profile.fameRating)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 fill-current" />
              {formatCompactNumber(profile.likesCount)}
            </span>
          </div>
        )}
        <Link
          href={otherUserId ? `/users/${otherUserId}` : '#'}
          aria-label="View profile"
          className="w-[34px] h-[34px] shrink-0 grid place-items-center rounded-md text-gray-400 hover:bg-pink-50 hover:text-pink-500 transition-colors"
        >
          <MoreHorizontal className="w-[18px] h-[18px]" />
        </Link>
      </header>

      <div
        ref={scrollRef}
        className="sm-scroll flex-1 min-h-0 overflow-y-auto px-5 py-[18px] flex flex-col gap-0.5"
      >
        {nextCursor && <div ref={topSentinelRef} className="h-1" aria-hidden />}
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-9 rounded-2xl bg-white/60 animate-pulse',
                  i % 2 === 0 ? 'self-start w-40' : 'self-end w-32',
                )}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="w-16 h-16 rounded-full strawberry-matcha-btn grid place-items-center shadow-lg shadow-pink-100">
              <Heart className="w-7 h-7 text-white fill-current" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              You matched with {headerName.split(' ')[0]}
            </h3>
            <p className="max-w-[260px] text-sm text-gray-500">
              Say hi and start a sweet conversation.
            </p>
          </div>
        ) : (
          days.map((day) => (
            <div key={day.key} className="contents">
              <div className="self-center my-2 px-3 py-[3px] rounded-full bg-white/70 border border-border-light text-[11px] font-medium text-gray-500">
                {day.label}
              </div>
              {day.msgs.map((m, i) => {
                const own = m.senderId === userId;
                const prev = day.msgs[i - 1];
                const next = day.msgs[i + 1];
                const gstart = !prev || prev.senderId !== m.senderId;
                const gend = !next || next.senderId !== m.senderId;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex flex-col max-w-[76%]',
                      own ? 'self-end items-end' : 'self-start items-start',
                      gstart ? 'mt-2.5' : 'mt-0.5',
                    )}
                  >
                    <div
                      className={cn(
                        'px-3.5 py-2 text-sm leading-snug whitespace-pre-wrap break-words shadow-xs animate-bubble-in rounded-2xl',
                        own
                          ? 'strawberry-matcha-btn text-white'
                          : 'bg-white border border-card-border text-gray-800',
                        own && gend && 'rounded-br-md',
                        !own && gend && 'rounded-bl-md',
                      )}
                    >
                      {m.body}
                    </div>
                    {gend && (
                      <div
                        className={cn(
                          'flex items-center gap-1 mt-1 px-0.5 text-[11px] text-gray-400',
                          own ? 'flex-row-reverse' : 'flex-row',
                        )}
                      >
                        <span className="tabular-nums">
                          {formatClockTime(m.createdAt)}
                        </span>
                        {own && <ReadIcon status={m.status} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}

        {peerTyping && (
          <div className="self-start flex items-center gap-1.5 mt-2.5 px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-card-border shadow-xs animate-bubble-in">
            <span className="typing-dot w-[7px] h-[7px] rounded-full bg-pink-300" />
            <span className="typing-dot w-[7px] h-[7px] rounded-full bg-pink-300" />
            <span className="typing-dot w-[7px] h-[7px] rounded-full bg-pink-300" />
          </div>
        )}
      </div>

      <div className="px-4 sm:px-[18px] py-3 border-t border-card-border bg-white/55">
        {disabled && (
          <p className="text-xs text-gray-400 text-center pb-2">
            You can no longer message this user.
          </p>
        )}
        <div className="flex items-end gap-2.5">
          <div className="flex-1 flex items-center gap-2 bg-white border border-border rounded-2xl pl-3.5 pr-1.5 py-1 focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-50 transition-all">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                pingTyping();
              }}
              onKeyDown={onKeyDown}
              disabled={disabled}
              rows={1}
              maxLength={MESSAGE_BODY_MAX}
              placeholder={disabled ? 'Messaging disabled' : 'Type a message…'}
              className="flex-1 resize-none bg-transparent border-0 outline-none text-sm text-gray-800 leading-snug py-1.5 max-h-32 disabled:text-gray-400"
            />
            <button
              type="button"
              onClick={() => textareaRef.current?.focus()}
              aria-label="Insert emoji"
              className="w-[34px] h-[34px] shrink-0 grid place-items-center rounded-md text-gray-400 hover:text-pink-500 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={send}
            disabled={disabled || draft.trim().length === 0}
            aria-label="Send message"
            className="w-11 h-11 shrink-0 rounded-full strawberry-matcha-btn text-white grid place-items-center shadow-md disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
          >
            <SendHorizontal className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
