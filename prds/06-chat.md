# PRD 06 — Chat

## Context
Subject §IV.6. Real-time 1-on-1 chat between connected users (mutual likes, not blocked). Global unread indicator visible from every page.

> **Current status:** The `/matches` page (`src/app/matches`) is the live home for connections — it lists every match (backed by the `matches` table; see PRD 05) and links each to the partner's profile. Chat itself is **not yet implemented**: the Matches page renders a "Chat coming soon" placeholder. A `conversation` is keyed to a `matches` row, so the `conversations`/`messages` tables below will reference matches as the connection source of truth.

---

## Scope
- Only connected pairs can exchange messages.
- Real-time delivery ≤ 10 seconds.
- Global unread message count in the header (any page).
- Message history persisted; paginated on scroll.

## Out of scope
- Group chat.
- Audio/video (bonus, PRD 08).
- Rich media / file sharing in messages.

---

## Transport decision (implemented)
**WebSocket via a standalone Socket.IO server** (`socket-server/`), run with `tsx` as a second process alongside `next dev`. App Router route handlers can't hold WebSocket upgrades and the app runs `next dev --turbopack` with no custom server, so a dedicated process is required.

Key choices:
- The socket server **imports the existing `ChatService`** (`@/server/factories` → `getChatService`) and both validates+persists and fans out in the same process — no cross-process bridge.
- **Sends go over the socket** (`message:send`); Next.js REST routes are read-only (list, history, metadata) plus `POST /api/conversations` (start) and `GET /api/conversations/unread-count` (badge seed).
- **No Redis.** A single Socket.IO instance with in-memory rooms (`user:<id>`) is sufficient for this project. Redis (the `socket.io-redis` adapter) is the scaling path only if multiple socket instances are ever run.
- Auth: the handshake JWT is validated with `decrypt()`/`SESSION_SECRET`. The token may arrive either in the Socket.IO `auth` payload (`io(url, { auth: { token } })`) **or** as the httpOnly `session` cookie (browser clients use the cookie via `withCredentials`).
- CORS: `credentials: true` with an allowlist from `SOCKET_CORS_ORIGIN` (comma-separated) falling back to `NEXT_PUBLIC_CLIENT_URL`.
- Transport security (**wss**): when `SOCKET_TLS_CERT` + `SOCKET_TLS_KEY` are set the server runs over HTTPS (so clients connect via `wss://`); otherwise plain `ws://` for local dev. In production set those + point `NEXT_PUBLIC_SOCKET_URL` at `wss://…` (or terminate TLS at a reverse proxy).
- Deployment: dedicated `socket-dev` / `socket-prod` stages in `Dockerfile` and a `socket` service in `compose.yaml` (port 4001), sharing `.env` with the app.
- Env: `SOCKET_PORT` (default 4001), `NEXT_PUBLIC_SOCKET_URL` (default `http://localhost:4001`), `SOCKET_CORS_ORIGIN`, `SOCKET_TLS_CERT`, `SOCKET_TLS_KEY`. Scripts: `bun run dev:socket` / `bun run start:socket`.

---

## Data model (implemented)
Relational `conversations` + `messages` (not JSONB — a message log is append-heavy and needs per-message `readAt` indexing and keyset pagination). Columns use the camelCase quoted convention and `gen_random_uuid()` PKs.

- `conversations` — `id` uuid, `"userIdA"`, `"userIdB"` (stored as `LEAST`/`GREATEST` of the pair), `"createdAt"`. `UNIQUE ("userIdA","userIdB")`, `CHECK ("userIdA" < "userIdB")`. **FKs to `users`, not `matches`** — chat history is preserved when a pair disconnects.
- `messages` — `id` uuid, `"conversationId"` (FK, `ON DELETE CASCADE`), `"senderId"` (FK), `body` text (`CHECK char_length BETWEEN 1 AND 2000`), `"createdAt"`, `"readAt"`.
  - Index `("conversationId", "createdAt" DESC)` for reverse pagination.
  - Partial index `("conversationId", "senderId") WHERE "readAt" IS NULL` for unread counts.

**Disconnect behaviour:** `ChatService.sendMessage` gates new sends with `SocialRepository.areMatched` (a live `matches` row). Unlike/block both delete the `matches` row, so sending is disabled immediately while history remains.

---

## API surface (implemented)
REST (Next.js, read-only + start) — all auth'd via the `x-user-id` middleware header, wrapped in `withErrorHandler`:
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/conversations` | List conversations with last message + unread count (single query, no N+1) |
| `POST` | `/api/conversations` | Start/find a conversation with a matched user → `{ id }` |
| `GET`  | `/api/conversations/[id]` | Conversation metadata (other user + `connected`) |
| `GET`  | `/api/conversations/[id]/messages` | Paginated messages (keyset cursor, newest-first) |
| `GET`  | `/api/conversations/unread-count` | Total unread across conversations (badge seed) |

WebSocket events (Socket.IO, room `user:<userId>`):
- `message:send` (client→server, with ack) — validate + persist via `ChatService`, then fan out
- `message:read` (client→server, with ack) — mark the other party's messages read
- `message:created` (server→client) — new message payload (to sender + recipient rooms)
- `message:read` (server→client) — `{ conversationId, readerId }`
- `conversation:updated` (server→client) — `{ conversationId }`, last-message preview changed

Send errors are returned in the ack as codes (e.g. `NO_LONGER_CONNECTED`, `MESSAGE_TOO_LONG`, `NOT_A_PARTICIPANT`) so the composer can disable / toast.

---

## UI
- `/messages` — conversation list: avatar, name, last message preview, unread count badge, last-message timestamp.
- `/messages/[id]` — thread: bubble list (own right, other left), auto-scroll to bottom on new message, composer input with Enter-to-send + Shift+Enter for newline, send button.
- Global header unread badge fed by zustand `useChatStore` (seeded from `GET /api/conversations/unread-count` on load, updated live by the socket).

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| CH-1 | connected user | to send a text message to my match | we can communicate |
| CH-2 | connected user | to receive messages in real time (≤ 10s) | the conversation feels live |
| CH-3 | connected user | to see my full message history when I open a thread | I can follow the conversation |
| CH-4 | connected user | new messages to auto-scroll the thread | I don't miss new messages |
| CH-5 | any logged-in user | to see an unread badge on the header from any page | I know when I have new messages |
| CH-6 | logged-in user | the badge to update within 10s of a message arriving | I'm alerted promptly |
| CH-7 | disconnected pair | to be unable to send messages after unliking | privacy is preserved after disconnect |
| CH-8 | logged-in user | long conversation history to load more on scroll | the page doesn't load everything at once |

---

## Tasks

### Migrations
- [x] Migration `create-conversations-table` — `id` uuid, `"userIdA"`/`"userIdB"` FK, `"createdAt"`; unique + `CHECK ("userIdA" < "userIdB")`
- [x] Migration `create-messages-table` — `id` uuid, `"conversationId"` FK, `"senderId"` FK, `body` text (`CHECK char_length BETWEEN 1 AND 2000`), `"createdAt"`, `"readAt"`; indexes

### Repository — `ConversationRepository`
- [x] `findOrCreate(userA, userB)` — canonical sorted pair; upsert `ON CONFLICT DO NOTHING` then select
- [x] `findByUser(userId)` — list with last message (LATERAL) + unread count (LATERAL), single query
- [x] `findById(id)` / `isParticipant(id, userId)` / `findMetaForUser(id, userId)` (thread header + connection state)

### Repository — `MessageRepository`
- [x] `create(conversationId, senderId, body)` — insert `RETURNING *`
- [x] `listByCursor(conversationId, cursor, limit)` — newest-first keyset pagination (reverse scroll-up)
- [x] `markRead(conversationId, readerId)` — `UPDATE ... SET "readAt" = NOW() WHERE "senderId" <> $2 AND "readAt" IS NULL`
- [x] `unreadCount(userId)` — total unread across all conversations

### Service — `ChatService`
- [x] `getConversations(userId)` — list DTOs
- [x] `getConversationMeta(userId, conversationId)` — other user + `connected`
- [x] `getMessages(userId, conversationId, cursor, limit)` — verify participant, paginate
- [x] `sendMessage(senderId, conversationId, body)` — verify participant + live match, validate body, insert; socket fans out `message:created`
- [x] `markRead(userId, conversationId)` — verify participant, mark read, returns other party for socket `message:read`
- [x] Domain errors: `NotAParticipantError`, `NoLongerConnectedError`, `MessageTooLongError`

### Socket layer (`socket-server/`)
- [x] Standalone Socket.IO server (`server.ts`) authenticating via the `session` cookie on handshake
- [x] Join authenticated users to room `user:<id>` on connect
- [x] `message:send` / `message:read` handlers reuse `ChatService`; dispatch `message:created`, `message:read`, `conversation:updated`
- [x] Client singleton `src/lib/socket-client.ts` + `useChatSocket` hook + `ChatSocketProvider` mounted in layout
- [ ] (n/a) online-presence toggle — presence is `lastSeenAt`-derived (PRD 05), no `is_online` column

### Routes (read-only + start)
- [x] `GET /api/conversations` — list
- [x] `POST /api/conversations` — start/find conversation → `{ id }`
- [x] `GET /api/conversations/[id]` — metadata
- [x] `GET /api/conversations/[id]/messages` — cursor page
- [x] `GET /api/conversations/unread-count` — badge seed
- (send/read are socket events, not REST)

### UI
- [x] `useChatStore` (zustand) — `unreadTotal`, `unreadByConversation`, `activeConversationId`, actions: init, receiveMessage, markReadLocal, setActiveConversation
- [x] `/messages` page — conversation list with real-time unread from store
- [x] `/messages/[id]` page — bubbles, upward infinite scroll with scroll-position preservation, composer
- [x] Header unread badge — `NavLink href="/messages"` reads `useChatStore.unreadTotal`
- [x] Composer: Enter to send, Shift+Enter for newline, disabled when not connected
- [x] Auto-scroll to bottom on new incoming message when already near bottom
- [x] `/matches` — "Message" button starts/opens a conversation (replaced the placeholder)

### Tests
- [x] Unit: `ChatService.sendMessage` — happy path, `NoLongerConnected`, `MessageTooLong`
- [x] Unit: `MessageRepository.markRead` — only marks other sender's messages
- [x] Unit: `ConversationRepository.findOrCreate` — canonical pair ordering
- [ ] E2E: two users connect → send message → recipient sees message within 10s → unread badge appears

---

## Acceptance criteria
- Unliking or blocking immediately disables send; in-flight message returns 403.
- Unread badge updates within 10s on any open page.
- Opening a thread marks messages as read server-side.
- No N+1 queries on conversation list.
- Message body rejected if > 2000 chars.
