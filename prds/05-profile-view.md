# PRD 05 — Profile View

## Context
Subject §IV.5. Public-facing view of another user's profile and all relational actions (like, unlike, block, report).

---

## Scope
Show everything about a user **except email and password hash**. Record every view in visit history.

Actions available from a profile page:
- **Like** a profile (mutual like = connection). Requires viewer to have a profile picture.
- **Unlike** (breaks connection, disables chat, suppresses further notifications from that user).
- **Check fame rating**.
- **See online status**; if offline, display last-seen timestamp.
- **Report** as a fake account.
- **Block** (removes from search/suggestions/notifications, disables chat).

Status indicators visible to the viewer:
- "Liked you" badge if the viewed user has liked the viewer.
- "Connected" badge if both have liked each other.
- "You liked them" state.
- Options to unlike or disconnect.

---

## Data model
- `profile_views` — id (uuid), viewer_id (FK), viewed_id (FK), viewed_at. Index on `(viewed_id, viewed_at DESC)`.
- `likes` — liker_id (FK), liked_id (FK), created_at. Composite PK `(liker_id, liked_id)`. Row deleted on unlike.
- `blocks` — blocker_id (FK), blocked_id (FK), created_at. Composite PK.
- `reports` — id (uuid), reporter_id (FK), reported_id (FK), reason (text), created_at.

Connection state is derived: mutual likes with no block between them.

---

## API surface
| Method | Route | Description |
|--------|-------|-------------|
| `GET`    | `/api/users/[id]` | Public profile; 404 if blocked either direction |
| `POST`   | `/api/users/[id]/view` | Record a profile view (rate-limited) |
| `POST`   | `/api/users/[id]/like` | Like a profile |
| `DELETE` | `/api/users/[id]/like` | Unlike a profile |
| `POST`   | `/api/users/[id]/block` | Block a user |
| `DELETE` | `/api/users/[id]/block` | Unblock a user |
| `POST`   | `/api/users/[id]/report` | Report as fake account |
| `GET`    | `/api/users/me/visits` | My visit history (who viewed me) |
| `GET`    | `/api/users/me/likes` | Who liked me |

---

## UI
- `/users/[id]` — hero section (pictures carousel, name, age, distance, fame badge, online indicator), bio, tag list, action bar.
- Relational badges: "Liked you ♥", "Connected ✓", "You liked them →".
- Like button disabled if viewer has no profile picture; tooltip explains why.
- Block/report in a `⋮` overflow menu; both require a confirmation dialog.
- Visit history and likes accessible from `/settings` or dedicated pages.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| PV-1 | logged-in user | to view another user's full profile | I can decide if I'm interested |
| PV-2 | viewed user | every visit to be recorded in my history | I know who has seen my profile |
| PV-3 | logged-in user | to like a profile | I express interest; if mutual, we connect |
| PV-4 | logged-in user | to unlike a profile | I withdraw interest and disable our connection |
| PV-5 | logged-in user | to see if someone liked me before I act | I can decide whether to reciprocate |
| PV-6 | logged-in user | to see a "Connected" badge when we've both liked each other | I clearly know we can chat |
| PV-7 | logged-in user | to see if a user is online or their last-seen time | I know if they're active |
| PV-8 | logged-in user | to block a user | they disappear from my experience entirely |
| PV-9 | logged-in user | to report a fake account | I help keep the platform safe |
| PV-10 | logged-in user | the like button to be disabled if I have no profile picture | I understand why I can't like yet |
| PV-11 | logged-in user | blocked users to return 404, not a "blocked" page | my blocks are not discoverable |

---

## Tasks

### Migrations
- [ ] Migration `create-profile-views-table` — id uuid, viewer_id, viewed_id, viewed_at; index `(viewed_id, viewed_at DESC)`, unique `(viewer_id, viewed_id, date(viewed_at))` (optional, for rate limiting)
- [ ] Migration `create-likes-table` — liker_id, liked_id, created_at; composite PK
- [ ] Migration `create-blocks-table` — blocker_id, blocked_id, created_at; composite PK
- [ ] Migration `create-reports-table` — id uuid, reporter_id, reported_id, reason text, created_at

### Repository — `SocialRepository`
- [ ] `recordView(viewerId, viewedId)` — insert into `profile_views` (idempotent within same day)
- [ ] `like(likerId, likedId)` — insert into `likes`; return whether it created a connection (both directions exist)
- [ ] `unlike(likerId, likedId)` — delete row; return whether a connection was broken
- [ ] `getLikeState(viewerId, targetId)` — `{ viewerLiked, targetLiked, connected }`
- [ ] `block(blockerId, blockedId)` — insert into `blocks`
- [ ] `unblock(blockerId, blockedId)` — delete row
- [ ] `isBlocked(userA, userB)` — either direction
- [ ] `report(reporterId, reportedId, reason)` — insert into `reports`
- [ ] `getVisitors(userId, limit, cursor)` — paginated visit history
- [ ] `getLikers(userId, limit, cursor)` — paginated list of who liked the user

### Service — `SocialService`
- [ ] `viewProfile(viewerId, targetId)` — check blocks, record view, emit `profile_viewed` notification
- [ ] `like(viewerId, targetId)` — check viewer has profile picture, check blocks, insert like, emit `liked` notification; if mutual emit `connected` notification
- [ ] `unlike(viewerId, targetId)` — delete like, emit `unliked` notification if was connected
- [ ] `block(viewerId, targetId)` — insert block, delete any existing likes both ways, emit no notification
- [ ] `unblock(viewerId, targetId)`
- [ ] `report(viewerId, targetId, reason)`
- [ ] `getPublicProfile(viewerId, targetId)` — 404 if blocked, return profile minus email/password
- [ ] Define domain errors: `CannotLikeWithoutPicture`, `AlreadyLiked`, `NotLiked`, `CannotSelfAct`, `AlreadyBlocked`

### Routes
- [ ] `GET /api/users/[id]` — call `SocialService.getPublicProfile`, return 200 or 404
- [ ] `POST /api/users/[id]/view` — call service, return 204
- [ ] `POST /api/users/[id]/like` / `DELETE` — call service, return 200 + new connection state
- [ ] `POST /api/users/[id]/block` / `DELETE`
- [ ] `POST /api/users/[id]/report`
- [ ] `GET /api/users/me/visits` — paginated
- [ ] `GET /api/users/me/likes` — paginated

### Online presence
- [ ] Heartbeat: update `users.last_seen_at` + `is_online = true` on every authenticated request via middleware
- [ ] Scheduled job or TTL: set `is_online = false` after 5 min of inactivity (or on WebSocket disconnect)

### UI
- [ ] `/users/[id]` page — hero, bio, tags, action bar
- [ ] `LikeButton` component — disabled + tooltip when no profile picture
- [ ] `RelationBadge` component — shows "Liked you", "Connected", "You liked them"
- [ ] `OnlineIndicator` component — green dot or "Last seen X ago"
- [ ] Overflow menu with "Block" + "Report" items + confirm dialogs
- [ ] `/settings/visitors` page showing `profile_views` list
- [ ] `/settings/likes` page showing likers list

### Tests
- [ ] Unit: `SocialService.like` — mutual like triggers connected notification
- [ ] Unit: `SocialService.like` — no profile picture → `CannotLikeWithoutPicture`
- [ ] Unit: `SocialService.block` — blocked user returns 404 on `getPublicProfile`
- [ ] Unit: `SocialService.unlike` — connection broken, notifications suppressed
- [ ] E2E: like → see "Connected" badge → unlike → badge gone → chat link disabled

---

## Acceptance criteria
- Visiting a profile inserts a row visible in `/api/users/me/visits`.
- Mutual likes create a connection and enable chat (PRD 06).
- Unliking disconnects and disables chat immediately.
- Blocked users never appear in browse/search/notifications.
- Self-view is prevented.
- Viewer must have a profile picture to like (enforced server-side).
