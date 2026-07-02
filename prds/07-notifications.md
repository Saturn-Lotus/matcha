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
- `notifications` — id (uuid), userId (FK), type (enum: `like` | `profile_view` | `message` | `match` | `unmatch`), actorId (FK → users), payload (jsonb — e.g. `{ conversationId }`), readAt (timestamptz), createdAt.
  - Index `(userId, createdAt DESC) WHERE readAt IS NULL` — for fast unread count + feed.
  - Index `(userId, createdAt DESC)` — for full paginated history.

---

## Delivery model
**Delivery = read**: a notification is marked read the moment a valid WebSocket client receives it. There is no separate user-triggered read action.

Both delivery paths use **atomic claim** (`UPDATE notifications SET readAt = NOW() WHERE ... AND readAt IS NULL RETURNING …`) so concurrent flush and `/notify` calls cannot double-deliver the same row — only the writer that flipped `readAt` from NULL emits.

- **Online user**: `NotificationService.emit()` inserts the row, then calls `POST /notify` on the socket server (internal HTTP) with the recipient `userId` and the notification DTO. The socket server attempts `claimById(userId, notification.id)` — if it wins the race, it emits `notification.created` to the `user:<id>` room.
- **Offline user**: row stays unread. On next connect, the socket server calls `notificationRepository.claimAllUnread(userId)` (atomic mark-and-return), then emits `notification.pending` with the claimed rows.
- **Badge**: driven by `useNotificationStore` (zustand). Incremented on `notification.created` WS event; bulk-set on `notification.pending`. Cleared when user clicks "Mark all read".

---

## Cross-process architecture
Next.js and the socket server are separate processes. The socket server exposes `POST /notify` on its existing HTTP server (guarded by `SOCKET_INTERNAL_SECRET`). `NotificationService` calls it fire-and-forget after inserting the DB row — if the socket server is down, the DB row survives and is delivered on next connect.

Env vars required:
- `SOCKET_INTERNAL_URL` — base URL of the socket server (e.g. `http://localhost:4001`)
- `SOCKET_INTERNAL_SECRET` — shared secret for the internal `/notify` endpoint

---

## API surface
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/notifications` | Paginated list (cursor, default 20). `cursor` must be an ISO date, `limit` a number 1–50 — invalid values → 400. `nextCursor` is null when the page is not full (no more items). |
| `POST` | `/api/notifications/read` | Mark IDs read (`{ ids: string[] }`, each a UUID — validated, invalid → 400) — empty array = mark all |
| `GET`  | `/api/notifications/unread-count` | Fast count for initial page load |

All three routes return 401 (`UnauthorizedException`) when the session header is absent.

WebSocket events (channel `user:<id>`):
- `notification.created` — pushed immediately when an online user receives a new notification
- `notification.pending` — array of unread notifications pushed on connect

---

## Emission rules
Emitted from **service layer** via `NotificationService.emit(userId, type, actorId, payload?)`:
- `SocialService.likeUser` → emits `like` to target; if mutual also emits `match` to both
- `SocialService.unlikeUser` → checks `areMatched` first; emits `unmatch` to the other user if they were connected
- `SocialService.recordView` → emits `profile_view` to target (rate-limited: once per viewer per 24h, checked via recent notification row)
- `ChatService.sendMessage` → emits `message` to recipient with `{ conversationId }` payload
- All emissions: check `isBlockedEitherDirection` — never emit to a user who has blocked the actor

---

## UI
- **`NotificationBell`** in `<NavigationBar>` — bell icon with badge from `useNotificationStore.unreadCount`; opens dropdown on click.
- **Dropdown** — top 5 recent notifications from store; "Mark all read" button; "See all" link.
- **`/notifications` page** — full paginated history, grouped by day (`formatDayLabel`), "Load more" cursor pagination, "Mark all read" button.
- **Toast** — `sonner` toast on `notification.created` WS event (already mounted in root layout).

Notification rendering:
- `like` → "{name} liked your profile" → links to `/users/[actorId]`
- `profile_view` → "{name} viewed your profile" → links to `/users/[actorId]`
- `message` → "{name} sent you a message" → links to `/messages/[conversationId]`
- `match` → "You and {name} are now connected!" → links to `/matches`
- `unmatch` → "{name} disconnected from you" → links to `/users/[actorId]`

---

## Key files
| File | Role |
|---|---|
| `migrations/1782124647807_create-notifications-table.js` | DB schema |
| `src/server/repositories/notification-repository.ts` | Data access |
| `src/server/services/notification.ts` | Business logic + WS push |
| `src/server/factories/notification-factory.ts` | DI factory |
| `src/server/schemas/notification.ts` | `MarkReadBodySchema`, `NotificationsQuerySchema` |
| `src/server/types.ts` | `NotificationDTO`, `NotificationType` |
| `socket-server/server.ts` | `/notify` handler + on-connect flush |
| `src/app/api/notifications/route.ts` | GET list |
| `src/app/api/notifications/read/route.ts` | POST mark read |
| `src/app/api/notifications/unread-count/route.ts` | GET count |
| `src/lib/stores/notification-store.ts` | Zustand store |
| `src/hooks/use-notification-socket.ts` | WS event hook |
| `src/app/components/notification-socket-provider.tsx` | Provider |
| `src/app/components/notification-bell.tsx` | Bell + dropdown |
| `src/app/notifications/page.tsx` | Full history page |

---

## Tasks status

### Migration
- [x] `create-notifications-table` — notifications table with notification_type enum and indexes

### Repository — `NotificationRepository`
- [x] `create(userId, type, actorId, payload?)` — insert + LEFT JOIN actor profile (tolerates actor with no profile row)
- [x] `listByUser(userId, cursor, limit)` — keyset paginated
- [x] `listUnread(userId)` — non-mutating read of unread rows
- [x] `claimById(userId, id)` — atomic `UPDATE … RETURNING id`; true iff this caller flipped the row from unread → read
- [x] `claimAllUnread(userId)` — atomic bulk mark-and-return for on-connect flush
- [x] `unreadCount(userId)` — COUNT WHERE readAt IS NULL
- [x] `markRead(userId, ids[])` — UPDATE by id array (user-triggered)
- [x] `markAllRead(userId)` — bulk UPDATE (user-triggered)
- [x] `findRecentViewNotification(actorId, userId)` — 24h rate-limit check

### Service — `NotificationService`
- [x] `emit(userId, type, actorId, payload?)` — block check, rate-limit, insert, fire-and-forget push. **Never throws** — any failure is logged and swallowed so caller flows (sendMessage / likeUser / recordView) stay clean.
- [x] Push body includes the recipient `userId` so the socket server can route to `user:<id>` (the DTO itself does not expose userId).
- [x] `list(userId, cursor, limit)` — paginated list
- [x] `unreadCount(userId)` — fast count
- [x] `markRead(userId, ids)` — delegates to repository (empty = mark all)

### Wiring
- [x] `NotificationService` injected into `SocialService`
- [x] `NotificationService` injected into `ChatService`
- [x] `SocialService.likeUser` emits `like` + `match` (if mutual)
- [x] `SocialService.unlikeUser` emits `unmatch` (if was matched)
- [x] `SocialService.recordView` emits `profile_view`
- [x] `ChatService.sendMessage` emits `message`

### Socket server
- [x] `/notify` internal HTTP endpoint
- [x] On-connect unread flush

### Routes
- [x] `GET /api/notifications`
- [x] `POST /api/notifications/read`
- [x] `GET /api/notifications/unread-count`

### UI
- [x] `useNotificationStore` (zustand)
- [x] `useNotificationSocket` hook
- [x] `NotificationSocketProvider` in root layout
- [x] `NotificationBell` in `<NavigationBar>`
- [x] `/notifications` page with infinite scroll and mark-all-read

---

## Acceptance criteria
- Each of the 5 events produces exactly one notification row of the correct type.
- `profile_view` notifications are deduplicated: same viewer → same target within 24h emits only one notification.
- Unread badge updates via WebSocket within 10s.
- Blocks suppress notifications for both directions.
- Notifications survive reloads (persisted in DB, not only in-memory).
- Offline notifications are delivered on next connect via `notification.pending`.
- Mark-read endpoints only affect rows owned by the authenticated user.
