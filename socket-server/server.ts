import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { Server, type Socket } from 'socket.io';
import { decrypt } from '@/lib/auth/session';
import { getChatService } from '@/server/factories/chat-factory';
import {
  SendMessageSchema,
  TypingSchema,
  MessageDeliveredSchema,
  MessageReadSchema,
} from '@/server/schemas';

const PORT = Number(process.env.SOCKET_PORT ?? 4001);
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? 'http://localhost:3000';

// Comma-separated allowlist of browser origins permitted to connect.
const CORS_ORIGINS = (process.env.SOCKET_CORS_ORIGIN ?? CLIENT_URL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const chatService = getChatService();

// Serve over TLS (enabling wss://) when a cert + key are provided; otherwise
// plain http (ws://) for local dev. In production, terminate TLS here or at a
// reverse proxy and point NEXT_PUBLIC_SOCKET_URL at wss://.
function createSocketHttpServer() {
  const certPath = process.env.SOCKET_TLS_CERT;
  const keyPath = process.env.SOCKET_TLS_KEY;
  if (certPath && keyPath) {
    return createHttpsServer({
      cert: readFileSync(certPath),
      key: readFileSync(keyPath),
    });
  }
  return createHttpServer();
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function room(userId: string): string {
  return `user:${userId}`;
}

function errorCode(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  switch (name) {
    case 'NoLongerConnectedError':
      return 'NO_LONGER_CONNECTED';
    case 'NotAParticipantError':
      return 'NOT_A_PARTICIPANT';
    case 'MessageTooLongError':
      return 'MESSAGE_TOO_LONG';
    case 'NotFoundException':
      return 'NOT_FOUND';
    default:
      return 'INTERNAL_ERROR';
  }
}

export function startSocketServer() {
  const httpServer = createSocketHttpServer();
  const io = new Server(httpServer, {
    cors: { origin: CORS_ORIGINS, credentials: true },
  });

  // Authenticate the session JWT on the handshake. The token may arrive either
  // in the `auth` payload (io(url, { auth: { token } })) or as the httpOnly
  // `session` cookie (browser clients with withCredentials).
  io.use(async (socket, next) => {
    try {
      const authToken =
        typeof socket.handshake.auth?.token === 'string'
          ? socket.handshake.auth.token
          : undefined;
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = authToken ?? cookies.session;
      const session = await decrypt(token);
      if (!session?.userId) {
        next(new Error('unauthorized'));
        return;
      }
      socket.data.userId = session.userId as string;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(room(userId));

    socket.on(
      'message:send',
      async (payload: unknown, ack?: (res: unknown) => void) => {
        try {
          const parsed = SendMessageSchema.safeParse(payload);
          if (!parsed.success || !parsed.data) {
            ack?.({ error: 'INVALID_PAYLOAD' });
            return;
          }
          const { conversationId, body } = parsed.data;
          const { message, recipientId } = await chatService.sendMessage(
            userId,
            conversationId,
            body,
          );
          io.to(room(recipientId))
            .to(room(userId))
            .emit('message:created', message);
          io.to(room(recipientId))
            .to(room(userId))
            .emit('conversation:updated', { conversationId });
          ack?.({ message });
        } catch (error) {
          console.error('message:send failed', error);
          ack?.({ error: errorCode(error) });
        }
      },
    );

    socket.on('typing', async (payload: unknown) => {
      try {
        const parsed = TypingSchema.safeParse(payload);
        if (!parsed.success || !parsed.data) return;
        const { conversationId, isTyping } = parsed.data;
        const otherUserId = await chatService.getOtherParticipant(
          userId,
          conversationId,
        );
        if (!otherUserId) return;
        io.to(room(otherUserId)).emit('typing', {
          conversationId,
          userId,
          isTyping,
        });
      } catch (error) {
        console.error('typing relay failed', error);
      }
    });

    socket.on('message:delivered', async (payload: unknown) => {
      try {
        const parsed = MessageDeliveredSchema.safeParse(payload);
        if (!parsed.success || !parsed.data) return;
        const { conversationId, messageId } = parsed.data;
        const otherUserId = await chatService.getOtherParticipant(
          userId,
          conversationId,
        );
        if (!otherUserId) return;
        io.to(room(otherUserId)).emit('message:delivered', {
          conversationId,
          messageId: messageId ?? null,
          recipientId: userId,
        });
      } catch (error) {
        console.error('message:delivered relay failed', error);
      }
    });

    socket.on(
      'message:read',
      async (payload: unknown, ack?: (res: unknown) => void) => {
        try {
          const parsed = MessageReadSchema.safeParse(payload);
          if (!parsed.success || !parsed.data) {
            ack?.({ error: 'INVALID_PAYLOAD' });
            return;
          }
          const { conversationId } = parsed.data;
          const { count, otherUserId } = await chatService.markRead(
            userId,
            conversationId,
          );
          io.to(room(userId))
            .to(room(otherUserId))
            .emit('message:read', { conversationId, readerId: userId });
          ack?.({ count });
        } catch (error) {
          console.error('message:read failed', error);
          ack?.({ error: errorCode(error) });
        }
      },
    );
  });

  httpServer.listen(PORT, () => {
    console.log(`Socket.IO server listening on :${PORT}`);
  });
}
