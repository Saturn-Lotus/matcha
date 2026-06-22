'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api';
import {
  connectSocket,
  disconnectSocket,
  emitDelivered,
  getSocket,
} from '@/lib/socket-client';
import { useChatStore } from '@/lib/stores/chat-store';
import type { MessageDTO } from '@/server/types';

export function useChatSocket(userId: string) {
  const init = useChatStore((s) => s.init);
  const receiveMessage = useChatStore((s) => s.receiveMessage);
  const markReadLocal = useChatStore((s) => s.markReadLocal);

  useEffect(() => {
    let cancelled = false;
    init(userId, 0);

    (async () => {
      try {
        const { count } = await apiClient.get<{ count: number }>(
          '/conversations/unread-count',
        );
        if (!cancelled) init(userId, count);
      } catch {
        // keep the optimistic zero
      }
    })();

    const socket = connectSocket();
    const onCreated = (message: MessageDTO) => {
      receiveMessage(message);
      if (message.senderId !== userId) {
        emitDelivered(message.conversationId, message.id);
      }
    };
    const onRead = (payload: { conversationId: string; readerId: string }) => {
      if (payload.readerId === userId) markReadLocal(payload.conversationId);
    };
    socket.on('message:created', onCreated);
    socket.on('message:read', onRead);

    return () => {
      cancelled = true;
      socket.off('message:created', onCreated);
      socket.off('message:read', onRead);
      disconnectSocket();
    };
  }, [userId, init, receiveMessage, markReadLocal]);

  return getSocket();
}
