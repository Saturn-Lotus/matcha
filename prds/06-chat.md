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

## Transport decision
**WebSocket** (preferred). Use the Node.js runtime on a dedicated route handler (`app/api/ws/route.ts`) or a standalone WS upgrade on the same port.  
Fallback: Server-Sent Events for receive + `POST` for send (only if WS is blocked by environment).  
Document the choice in the implementation PR and update this PRD.

---

## Data model
- `conversations` — id (uuid), user_a_id, user_b_id (always stored as `min(a,b)`, `max(a,b)` to enforce uniqueness), created_at. Unique `(user_a_id, user_b_id)`.
- `messages` — id (uuid), conversation_id (FK), sender_id (FK), body (text, max 2000), created_at, read_at.
  - Index `(conversation_id, created_at DESC)`.
  - Index `(conversation_id, sender_id != viewer, read_at IS NULL)` for unread counts.

---

## API surface
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/conversations` | List conversations with last message + unread count |
| `GET`  | `/api/conversations/[id]` | Single conversation metadata |
| `GET`  | `/api/conversations/[id]/messages` | Paginated messages (cursor) |
| `POST` | `/api/conversations/[id]/messages` | Send a message |
| `POST` | `/api/conversations/[id]/read` | Mark all messages as read |

WebSocket events (channel `user:<userId>`):
- `message.created` — new message payload
- `message.read` — messages marked read
- `conversation.updated` — last message preview changed

---

## UI
- `/messages` — conversation list: avatar, name, last message preview, unread count badge, last-message timestamp.
- `/messages/[id]` — thread: bubble list (own right, other left), auto-scroll to bottom on new message, composer input with Enter-to-send + Shift+Enter for newline, send button.
- Global header unread badge fed by zustand `useChatStore` (initialised from session, updated by WebSocket).

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
- [ ] Migration `create-conversations-table` — id uuid, user_a_id FK, user_b_id FK, created_at; unique `(user_a_id, user_b_id)`
- [ ] Migration `create-messages-table` — id uuid, conversation_id FK, sender_id FK, body text (check length ≤ 2000), created_at, read_at; indexes

### Repository — `ConversationRepository`
- [ ] `findOrCreate(userA, userB)` — canonical sorted pair; upsert `ON CONFLICT DO NOTHING RETURNING *`
- [ ] `findByUser(userId)` — list with last message + unread count (single query with subqueries)
- [ ] `findById(id)` — with participant check

### Repository — `MessageRepository`
- [ ] `create(conversationId, senderId, body)` — insert
- [ ] `listByCursor(conversationId, cursor, limit)` — oldest-first cursor pagination
- [ ] `markRead(conversationId, readerId)` — `UPDATE messages SET read_at = NOW() WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`
- [ ] `unreadCount(userId)` — total unread across all conversations

### Service — `ChatService`
- [ ] `getConversations(userId)` — list DTOs
- [ ] `getMessages(userId, conversationId, cursor)` — verify participant, paginate
- [ ] `sendMessage(senderId, conversationId, body)` — verify connection still active (not blocked, still mutual likes), validate body, insert, push WS event `message.created`
- [ ] `markRead(userId, conversationId)` — call repo, push WS event `message.read`
- [ ] Define domain errors: `NotAParticipant`, `NoLongerConnected`, `MessageTooLong`

### WebSocket layer
- [ ] `src/lib/socket.ts` — singleton WS server; authenticate via session cookie on upgrade
- [ ] Subscribe authenticated users to channel `user:<id>` on connect
- [ ] Dispatch `message.created`, `message.read`, `conversation.updated` events
- [ ] On `logout` or socket close, set `users.is_online = false` (reuse from PRD 05 online presence)

### Routes
- [ ] `GET /api/conversations` — call service, return list
- [ ] `GET /api/conversations/[id]/messages` — parse cursor, call service, return page
- [ ] `POST /api/conversations/[id]/messages` — validate body, call service, return 201
- [ ] `POST /api/conversations/[id]/read` — call service, return 204

### UI
- [ ] `useChatStore` (zustand) — conversations map, unread totals, actions: init, receiveMessage, markRead
- [ ] `/messages` page — conversation list with real-time unread update from store
- [ ] `/messages/[id]` page — message bubbles, infinite scroll upward for history, composer
- [ ] Header unread badge component reads from `useChatStore`
- [ ] Composer: Enter to send, Shift+Enter for newline, disabled + tooltip when not connected
- [ ] Auto-scroll to bottom on new incoming message when already at bottom

### Tests
- [ ] Unit: `ChatService.sendMessage` — happy path, `NoLongerConnected` (unlike scenario), `MessageTooLong`
- [ ] Unit: `MessageRepository.markRead` — only marks other sender's messages
- [ ] Unit: `ConversationRepository.findOrCreate` — canonical pair ordering
- [ ] E2E: two users connect → send message → recipient sees message within 10s → unread badge appears

---

## Acceptance criteria
- Unliking or blocking immediately disables send; in-flight message returns 403.
- Unread badge updates within 10s on any open page.
- Opening a thread marks messages as read server-side.
- No N+1 queries on conversation list.
- Message body rejected if > 2000 chars.
