'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { connectSocket } from '@/lib/socket-client';
import { useNotificationStore } from '@/lib/stores/notification-store';
import type { NotificationDTO } from '@/server/types';

function notificationMessage(n: NotificationDTO): string {
  const name = n.actorFirstName;
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

export function useNotificationSocket(userId: string) {
  const init = useNotificationStore((s) => s.init);
  const addOne = useNotificationStore((s) => s.addOne);
  const addPending = useNotificationStore((s) => s.addPending);

  useEffect(() => {
    let cancelled = false;

    const loadUnreadCount = async () => {
      try {
        const { count } = await apiClient.get<{ count: number }>(
          '/notifications/unread-count',
        );
        if (!cancelled) init(count);
      } catch {
        // keep optimistic zero
      }
    };
    loadUnreadCount();

    const socket = connectSocket();

    const onCreated = (n: NotificationDTO) => {
      addOne(n);
      toast(notificationMessage(n));
    };

    const onPending = (ns: NotificationDTO[]) => {
      if (ns.length > 0) addPending(ns);
    };

    socket.on('notification.created', onCreated);
    socket.on('notification.pending', onPending);

    return () => {
      cancelled = true;
      socket.off('notification.created', onCreated);
      socket.off('notification.pending', onPending);
    };
  }, [userId, init, addOne, addPending]);
}
