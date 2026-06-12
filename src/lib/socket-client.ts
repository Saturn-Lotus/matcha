import { io, type Socket } from 'socket.io-client';
import type { MessageDTO } from '@/server/types';

export type SendAck = { message: MessageDTO } | { error: string };

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4001';
    socket = io(url, { withCredentials: true, autoConnect: false });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
}

export function emitSendMessage(
  conversationId: string,
  body: string,
): Promise<SendAck> {
  return new Promise((resolve) => {
    getSocket().emit(
      'message:send',
      { conversationId, body },
      (res: SendAck) => resolve(res),
    );
  });
}

export function emitMarkRead(conversationId: string): void {
  getSocket().emit('message:read', { conversationId });
}
