'use client';

import { useChatSocket } from '@/hooks/use-chat-socket';

export function ChatSocketProvider({ userId }: { userId: string }) {
  useChatSocket(userId);
  return null;
}
