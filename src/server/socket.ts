import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { decrypt, SessionPayload } from '../lib/auth/session.ts';
import { chatEvents, CHAT_EVENT } from './events.ts';
import { parse } from 'cookie';

export class SocketServer {
  private wss: WebSocketServer;
  private userSockets: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (request, socket, head) => {
      const { pathname } = new URL(request.url!, `http://${request.headers.host}`);
      if (pathname !== '/api/ws') return;

      try {
        const userId = await this.authenticate(request);
        if (!userId) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, userId);
        });
      } catch (error) {
        console.error('WS upgrade error:', error);
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage, userId: string) => {
      this.registerSocket(userId, ws);

      ws.on('close', () => {
        this.unregisterSocket(userId, ws);
      });

      // Heartbeat
      (ws as any).isAlive = true;
      ws.on('pong', () => {
        (ws as any).isAlive = true;
      });
    });

    // Listen to chat events
    chatEvents.on(CHAT_EVENT.MESSAGE_CREATED, ({ message, recipientId }) => {
      this.sendToUser(recipientId, {
        type: CHAT_EVENT.MESSAGE_CREATED,
        payload: message,
      });
      // Also send to sender (if they have multiple tabs)
      this.sendToUser(message.senderId, {
        type: CHAT_EVENT.MESSAGE_CREATED,
        payload: message,
      });
    });

    chatEvents.on(CHAT_EVENT.MESSAGE_READ, ({ conversationId, userId }) => {
      // Notify the other participant that messages were read
      // We need to know who the other participant is... 
      // This event might need more info or we just broadcast to the conversation channel if we had one.
      // For now, let's keep it simple.
    });

    // Keep-alive interval
    setInterval(() => {
      this.wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private async authenticate(request: IncomingMessage): Promise<string | null> {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['session'];
    if (!sessionToken) return null;

    const payload = (await decrypt(sessionToken)) as SessionPayload | undefined;
    return payload?.userId || null;
  }

  private registerSocket(userId: string, ws: WebSocket) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(ws);
  }

  private unregisterSocket(userId: string, ws: WebSocket) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        // TODO: Set user.isOnline = false in DB
      }
    }
  }

  private sendToUser(userId: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const message = JSON.stringify(data);
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }
}
