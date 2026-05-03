# PRD 07 — Notifications

## Context
Subject §IV.7. Real-time user notifications for social events, with a global unread indicator on every page.

---

## Scope
Deliver within 10s for these 5 event types:
1. Someone liked your profile.
2. Someone viewed your profile.
3. You received a message (linked to a conversation).
4. A user you liked also liked you back (match / connection formed).
5. A connected user unliked you (disconnection).

Users must be able to see unread count from **any page**. They must also access a full notification history.

---

## Data model
- `notifications` — id (uuid), user_id (FK), type (enum: `like` | `profile_view` | `message` | `match` | `unmatch`), actor_id (FK → users), payload (jsonb — e.g. `{ conversationId }`), read_at (timestamptz), created_at.
  - Index `(user_id, read_at IS NULL, created_at DESC)` — for unread count + recent feed.

---

## API surface
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/notifications` | Paginated notification list (cursor, default 20) |
| `POST` | `/api/notifications/read` | Mark notification IDs as read (body: `{ ids: string[] }` or `"all"`) |
| `GET`  | `/api/notifications/unread-count` | Fast unread count (for initial page load) |

WebSocket (shared with PRD 06, channel `user:<id>`):
- `notification.created` — new notification payload pushed immediately on event
- `notification.read` — confirmation of server-side mark-read

---

## Emission
Emitted from **service layer** via `NotificationService.emit(userId, type, actorId, payload?)`:
- `SocialService.like` → emits `like` to target; if mutual also emits `match` to both
- `SocialService.unlike` → emits `unmatch` to the other user if they were connected
- `SocialService.viewProfile` → emits `profile_view` to target (rate-limited: once per viewer per day)
- `ChatService.sendMessage` → emits `message` to recipient
- All emissions: check blocks — never emit to a user who has blocked the actor

---

## UI
- **Header bell icon** — unread notification count badge; populated from `useNotificationStore` (zustand), initialised with `GET /api/notifications/unread-count`, updated live via WebSocket.
- **Dropdown** — top 5 recent unread items; click → mark read + navigate to source; "See all" link.
- **`/notifications` page** — full paginated history, grouped by day, infinite scroll; mark-all-read button.

Notification item renders:
- `like` → "**@username** liked your profile" → links to `/users/[id]`
- `profile_view` → "**@username** viewed your profile" → links to `/users/[id]`
- `message` → "**@username** sent you a message" → links to `/messages/[conversationId]`
- `match` → "You and **@username** are now connected!" → links to `/messages/[conversationId]`
- `unmatch` → "**@username** disconnected from you"

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| NT-1 | logged-in user | to see a badge when I receive a like | I know someone is interested in me |
| NT-2 | logged-in user | to see a badge when someone views my profile | I know who's checking me out |
| NT-3 | logged-in user | to see a badge when I receive a message | I don't miss incoming conversations |
| NT-4 | logged-in user | to be notified when a match forms | I know I can start chatting |
| NT-5 | logged-in user | to be notified when someone unmatches me | I understand why a chat disappeared |
| NT-6 | logged-in user | the badge to appear from any page, within 10s | I'm always informed without checking manually |
| NT-7 | logged-in user | clicking a notification to take me to the right page | I can act on it immediately |
| NT-8 | logged-in user | to mark notifications as read | the badge clears once I've seen them |
| NT-9 | logged-in user | not to receive notifications from users I've blocked | blocked users don't intrude on me |

---

## Tasks

### Migration
- [ ] Migration `create-notifications-table` — id uuid, user_id FK, type (enum of 5 values), actor_id FK, payload jsonb, read_at, created_at; index `(user_id, read_at IS NULL, created_at DESC)`

### Repository — `NotificationRepository`
- [ ] `create(userId, type, actorId, payload?)` — insert
- [ ] `listByUser(userId, cursor, limit)` — paginated, newest first
- [ ] `unreadCount(userId)` — `COUNT(*) WHERE read_at IS NULL`
- [ ] `markRead(userId, ids[])` — `UPDATE ... SET read_at = NOW() WHERE id = ANY($1) AND user_id = $2`
- [ ] `markAllRead(userId)` — bulk update

### Service — `NotificationService`
- [ ] `emit(userId, type, actorId, payload?)` — check if actor is blocked by userId (skip if so), insert notification row, push WS event `notification.created` to `user:<userId>`
- [ ] `list(userId, cursor)` — call repository, return DTOs with actor profile summary
- [ ] `unreadCount(userId)` — fast path via repository
- [ ] `markRead(userId, ids | 'all')` — call repository, push WS `notification.read`
- [ ] Rate-limit `profile_view` emission: check `notification_repository.findRecentViewNotification(viewerId, targetId, sinceHours=24)` before emitting

### Wiring
- [ ] Inject `NotificationService` into `SocialService` constructor
- [ ] Inject `NotificationService` into `ChatService` constructor
- [ ] Emit the correct type for each of the 5 events (see Emission section)

### Routes
- [ ] `GET /api/notifications` — parse cursor, call service list, return 200
- [ ] `POST /api/notifications/read` — parse `{ ids }` or `"all"`, call service, return 204
- [ ] `GET /api/notifications/unread-count` — return `{ count: number }`

### UI
- [ ] `useNotificationStore` (zustand) — unread count, recent list, actions: init (fetch count), addNotification (WS push), markRead, markAllRead
- [ ] `NotificationBell` component in `<Header>` — badge with count from store, opens dropdown on click
- [ ] `NotificationDropdown` — top 5 items, "See all" link, "Mark all read" button
- [ ] `NotificationItem` component — icon per type, formatted message, relative timestamp, unread highlight
- [ ] `/notifications` page — full history with infinite scroll, mark-all-read button
- [ ] Toast on new `notification.created` WS event when user is on a non-notification page (optional but polished)

### Tests
- [ ] Unit: `NotificationService.emit` — blocked actor → no notification created
- [ ] Unit: `NotificationService.emit` — `profile_view` rate-limit: second view same day → no duplicate
- [ ] Unit: `NotificationService.markRead` — cannot mark another user's notifications read
- [ ] Unit: all 5 event types are emitted from the correct service methods
- [ ] E2E: user A likes user B → user B sees notification badge update within 10s

---

## Acceptance criteria
- Each of the 5 events produces exactly one notification row of the correct type.
- Unread badge accurate across tabs within 10s.
- Blocks suppress notifications for both directions.
- Notifications survive reloads (persisted in DB, not only in-memory).
- Mark-read endpoints only accept IDs owned by the authenticated user.
