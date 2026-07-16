'use client';

import { useNotificationSocket } from '@/hooks/use-notification-socket';

export function NotificationSocketProvider({ userId }: { userId: string }) {
  useNotificationSocket(userId);
  return null;
}
