# PRD 05 — Profile View

## Context
Subject §IV.5. Public-facing view of another user's profile and all relational actions (like, unlike, block, report).

---

## Scope
Show everything about a user **except email and password hash**. Record every view in visit history.

Profile data is surfaced through **two complementary surfaces**, both of which must expose the full §IV.5 action set and relational state:

1. **Feed card** (`/browse` Discover tab) — immersive, swipeable TikTok-style discovery surface. Primary information visible inline; full details revealed via a "More" sheet.
2. **Permalink page** (`/users/[id]`) — minimal Messenger-style profile reached from notifications, chat headers, and any future share/link entry point. Visually quiet, but information-complete.

The two surfaces share the same underlying component (`FeedCard`) where it makes sense, but the permalink renders a leaner layout optimized for referenced (not discovery) context.

Actions available from both surfaces:
- **Like** a profile (mutual like = connection). Requires viewer to have a profile picture.
- **Unlike** (breaks connection, disables chat, suppresses further notifications from that user).
- **Check fame rating**.
- **See online status**; if offline, display last-seen timestamp.
- **Report** as a fake account.
- **Block** (removes from search/suggestions/notifications, disables chat).

Status indicators visible to the viewer (both surfaces):
- "Liked you" badge / primary-colored icon if the viewed user has liked the viewer.
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

### Surface 1 — Feed card (`/browse` Discover tab)
- Existing `FeedCard` component: photo carousel, name, age (in More), online/last-seen, fame, bio, top tags, like/pass buttons.
- **Relational state** rendered as a primary-colored icon/badge directly on the card (e.g. heart-back-glyph for "Liked you", linked-rings for "Connected"). Visible without opening the More sheet so the viewer can decide before acting.
- **"More" sheet** (opened via a `⋮` or "More" button next to like/pass) reveals:
  - Full photo gallery
  - Gender, sexual preferences, distance / location
  - All interest tags
  - Full bio
  - Block and Report actions (with confirm dialogs)
  - Unlike (if currently liked)
- Like button disabled if viewer has no profile picture; tooltip explains why.
- **View recording trigger**: when the viewer advances past the first photo (taps to photo #2) of a card. This converts the "card flashed past me" noise into an intentional engagement signal. Idempotent per viewer/viewed pair per day.

### Surface 2 — Permalink page (`/users/[id]`)
- Hero-card layout (a single large 4:5 / 5:6 photo card on top, content stacked beneath). Entry point for notifications, chat headers, and direct links.
- **Above the fold**: hero photo with photo-carousel pips, chevron arrows, online/last-seen + location/distance chips, relational badge, name + age + gender + orientation + fame overlaid at the bottom of the photo. Action row (Like/Unlike, Message if connected, `⋮` overflow with Block + Report) immediately below the card.
- **Below the fold**: `About` (bio), `Interests` (chips alternating strawberry/matcha), `Details` (icon list: gender, sexual preference, city + distance, online/last-seen, fame rating).
- **Friendly labels** — raw enum values are never shown. Gender renders as `Man`/`Woman`. Sexual preference renders as `Interested in men`/`Interested in women`/`Interested in everyone`. A derived `Straight`/`Gay`/`Bi` orientation chip sits next to the name (computed from `gender` × `sexualPreference`). All helpers live in [src/lib/utils.ts](src/lib/utils.ts) (`formatGenderLabel`, `formatPreferenceLabel`, `formatOrientationLabel`, `formatDistanceKm`).
- **View recording trigger**: fired once on mount (idempotent per day).
- Self-view → server-side redirect to `/settings`.
- Blocked either direction → 404 (PV-11).

### Visitors & likers history
- Surfaced through a floating **Activity pill** at the bottom of `/browse` that opens an **Activity bottom-sheet drawer** ([activity-drawer.tsx](src/app/browse/components/activity-drawer.tsx)) containing two pill tabs (Likes / Views). This replaced the cramped 3-tab pill so Discover stays immersive on mobile and the inbox affordance gets a distinctive entry point. No separate `/settings/visitors` or `/settings/likes` pages required.

---

## User Stories

Listed in execution order. Stage groupings reflect shippable, dependency-aware increments (Stage 1 = data-layer foundation, no user-visible story).

| Stage | # | As a… | I want… | So that… |
|-------|---|-------|---------|----------|
| 2 | PV-1 | logged-in user | to view another user's full profile | I can decide if I'm interested |
| 2 | PV-2 | viewed user | every visit to be recorded in my history | I know who has seen my profile |
| 3 | PV-3 | logged-in user | to like a profile | I express interest; if mutual, we connect |
| 3 | PV-10 | logged-in user | the like button to be disabled if I have no profile picture | I understand why I can't like yet |
| 3 | PV-5 | logged-in user | to see if someone liked me before I act | I can decide whether to reciprocate |
| 3 | PV-6 | logged-in user | to see a "Connected" badge when we've both liked each other | I clearly know we can chat |
| 4 | PV-4 | logged-in user | to unlike a profile | I withdraw interest and disable our connection |
| 5 | PV-8 | logged-in user | to block a user | they disappear from my experience entirely |
| 5 | PV-11 | logged-in user | blocked users to return 404, not a "blocked" page | my blocks are not discoverable |
| 6 | PV-9 | logged-in user | to report a fake account | I help keep the platform safe |
| 7 | PV-7 | logged-in user | to see if a user is online or their last-seen time | I know if they're active |

Stage 8 (feed card adoption of all the above) is a UI assembly step — no new user story, it just brings the existing surface in line.

---

## Tasks

### Migrations
- [ ] Migration `create-profile-views-table` — id uuid, viewer_id, viewed_id, viewed_at; index `(viewed_id, viewed_at DESC)`, unique `(viewer_id, viewed_id, date(viewed_at))` (optional, for rate limiting)
- [ ] Migration `create-likes-table` — liker_id, liked_id, created_at; composite PK
- [x] Migration `create-user-blocks-table` — `blockerUserId`, `blockedUserId`, `blockedAt`; composite PK + index on `blockedUserId` + self-block CHECK
- [x] Migration `create-account-reports-table` — id uuid, reporterUserId, reportedUserId, reason text, createdAt; unique `(reporterUserId, reportedUserId)` + self-report CHECK + index on `reportedUserId`

### Repository — `SocialRepository`
- [ ] `recordView(viewerId, viewedId)` — insert into `profile_views` (idempotent within same day)
- [ ] `like(likerId, likedId)` — insert into `likes`; return whether it created a connection (both directions exist)
- [ ] `unlike(likerId, likedId)` — delete row; return whether a connection was broken
- [ ] `getLikeState(viewerId, targetId)` — `{ viewerLiked, targetLiked, connected }`
- [x] `blockUser(blockerId, blockedId)` — insert into `user_blocks` + delete likes both directions inside a transaction
- [ ] `unblock(blockerId, blockedId)` — delete row
- [x] `isBlockedEitherDirection(userA, userB)` — either direction
- [x] `report(reporterId, reportedId, reason)` — insert into `account_reports`; returns `false` if a report for this pair already exists (via `ON CONFLICT DO NOTHING`)
- [ ] `getVisitors(userId, limit, cursor)` — paginated visit history
- [ ] `getLikers(userId, limit, cursor)` — paginated list of who liked the user

### Service — `SocialService`
- [ ] `viewProfile(viewerId, targetId)` — check blocks, record view, emit `profile_viewed` notification
- [x] `likeUser(likerUserId, likedUserId)` — checks viewer has at least one profile picture (throws `CannotLikeWithoutPictureError`), inserts like, recomputes fame; mutual-like notification still pending
- [ ] `unlike(viewerId, targetId)` — delete like, emit `unliked` notification if was connected
- [x] `blockUser(viewerId, targetId)` — validates target exists, throws `CannotSelfActError`, delegates to repo (atomic block + like cleanup), recomputes fame
- [ ] `unblock(viewerId, targetId)`
- [x] `report(viewerId, targetId, reason)` — validates target exists, throws `CannotSelfActError`, throws `AlreadyReportedError` if the viewer has already reported this user
- [x] `getPublicProfile(viewerId, targetId)` — returns profile minus email/password plus `age` (derived from `birthDate`), `city`, `distanceKm` (via `LocationRepository.distanceKmBetween`), and `viewerLiked` / `targetLiked` / `targetViewedViewer` / `connected`; throws `UserNotFoundError` (404) if user missing or if blocked in either direction
- [x] Domain error: `CannotLikeWithoutPictureError` (HTTP 422)
- [x] Domain error: `CannotSelfActError` (HTTP 400)
- [x] Domain error: `AlreadyReportedError` (HTTP 409)
- [ ] Remaining domain errors: `AlreadyLiked`, `NotLiked`, `AlreadyBlocked`

### Routes
- [ ] `GET /api/users/[id]` — call `SocialService.getPublicProfile`, return 200 or 404
- [ ] `POST /api/users/[id]/view` — call service, return 204
- [ ] `POST /api/users/[id]/like` / `DELETE` — call service, return 200 + new connection state
- [x] `POST /api/users/[id]/block` — calls `socialService.blockUser`, returns 204
- [ ] `DELETE /api/users/[id]/block` (unblock — out of scope for this stage)
- [x] `POST /api/users/[id]/report` — validates body via `ReportBodySchema` (`reason` enum: `fake_account` | `spam` | `harassment` | `other`), returns 204
- [ ] `GET /api/users/me/visits` — paginated
- [ ] `GET /api/users/me/likes` — paginated

### Online presence
- [ ] Heartbeat: update `users.last_seen_at` + `is_online = true` on every authenticated request via middleware
- [ ] Scheduled job or TTL: set `is_online = false` after 5 min of inactivity (or on WebSocket disconnect)

### UI
- [ ] `FeedCard` — extend with "More" button next to like/pass, opening a sheet with full profile details + block/report/unlike
- [x] `FeedCard` — render relational state as an icon badge on the card (top-left), driven by `BrowseProfile.connected`/`targetLiked`/`targetViewedViewer`; uses shared `RelationBadge`
- [x] `FeedCard` — emit a `view` event when the viewer advances past the first photo (idempotent per session via `recordedViewsRef` in `discover-feed.tsx`; server enforces idempotency per pair via `ON CONFLICT` in `social-repository.ts`)
- [x] `/users/[id]` page — hero-card layout: 4:5 photo card on top with carousel pips, chevron nav, online/distance chips, relational badge, name + age + gender + orientation + fame overlay; action row (Like / Message / More) below; About, Interests, Details sections ([profile-view.tsx](src/app/users/[id]/profile-view.tsx))
- [x] `/users/[id]` — fire `POST /api/users/[id]/views` once on mount ([profile-view.tsx](src/app/users/[id]/profile-view.tsx))
- [x] `/users/[id]` — Like / Unlike button with optimistic toggle and burst animation; initial state from `viewerLiked` returned by `GET /api/users/[id]` ([profile-view.tsx](src/app/users/[id]/profile-view.tsx))
- [x] `/users/[id]` — server-side redirect to `/settings` if `id === viewer.id` ([users/[id]/page.tsx](src/app/users/[id]/page.tsx))
- [x] `/users/[id]` — returns 404 (renders the existing "User not found" UI) when blocked either direction; enforced in `SocialService.getPublicProfile` via `SocialRepository.isBlockedEitherDirection`
- [x] Browse feed hides blocked users in either direction (`NOT EXISTS` clause against `user_blocks` in `getUsersWithProfiles`)
- [x] Like button gated when viewer has no profile picture — server-side via `CannotLikeWithoutPictureError` in `SocialService.likeUser`, client-side via `viewerHasAvatar` prop drilled from `browse/page.tsx` and `users/[id]/page.tsx` with `Tooltip` + Sonner toast
- [x] `RelationBadge` component — `connected` / `liked-you` / `viewed-you` variants ([src/app/components/ui/relation-badge.tsx](src/app/components/ui/relation-badge.tsx)); shared between feed card and permalink
- [x] Friendly label helpers — `formatGenderLabel`, `formatPreferenceLabel`, `formatOrientationLabel`, `formatDistanceKm` in [src/lib/utils.ts](src/lib/utils.ts) so raw enum values (`male`/`female`/`both`) never reach the UI
- [ ] `OnlineIndicator` component — green dot or "Last seen X ago"
- [x] Overflow menu with "Block" + "Report" items (UI only — stubs that toast "coming soon"; live in both the subnav kebab and the `More` action button on [profile-view.tsx](src/app/users/[id]/profile-view.tsx)); confirm dialogs + wired actions still pending
- [ ] Notifications and chat headers link to `/users/[id]` (deep-link target)

### Tests
- [ ] Unit: `SocialService.like` — mutual like triggers connected notification
- [ ] Unit: `SocialService.like` — no profile picture → `CannotLikeWithoutPicture`
- [ ] Unit: `SocialService.block` — blocked user returns 404 on `getPublicProfile`
- [ ] Unit: `SocialService.unlike` — connection broken, notifications suppressed
- [ ] E2E: like → see "Connected" badge → unlike → badge gone → chat link disabled

---

## Acceptance criteria
- Profile data (everything except email and password hash) is reachable from both the feed card "More" sheet and the `/users/[id]` permalink.
- Advancing past the first photo of a feed card OR opening `/users/[id]` inserts a row visible in `/api/users/me/visits` (idempotent per viewer/viewed pair per day).
- Relational state ("Liked you" / "Connected" / "You liked them") is visible on the feed card itself (no need to open "More") and on the permalink above the fold.
- Notifications and chat headers navigate to `/users/[id]` for a specific user.
- Mutual likes create a connection and enable chat (PRD 06).
- Unliking disconnects and disables chat immediately.
- Blocked users never appear in browse/search/notifications; `/users/[id]` returns 404 if blocked either direction.
- Self-view is prevented: `/users/[id]` with the viewer's own id redirects to `/settings`.
- Viewer must have a profile picture to like (enforced server-side; UI disables the button with a tooltip).
