# PRD 02 — User Profile

## Context
Subject §IV.2. After login, users complete a profile that powers matching, browsing, and profile views.

---

## Scope
Required fields (editable at any time):
- Gender.
- Sexual preferences (heterosexual / homosexual / bisexual). Default = bisexual if unset.
- Biography (free text, length-bounded).
- Interests as reusable tags (e.g. `#vegan`). Tags are shared across users.
- Up to 5 pictures; exactly one designated as profile picture.
- Editable identity fields: first name, last name, email (email change re-triggers verification).
- Location: GPS with explicit consent; manual fallback (city/neighborhood) if declined. User can modify location any time.

Profile read surface:
- Fame rating (public, computed, see "Fame rating" below).
- "Who viewed me" list (populated by PRD 05).
- "Who liked me" list (populated by PRD 05).

## Out of scope
- Photo gallery with drag-and-drop editing (bonus, PRD 08).
- Interactive map of users (bonus, PRD 08).

---

## Data model
- `users` — extend with: gender (enum), sexual_preferences (enum), biography (text), fame_rating (int, cached), last_seen_at, is_online.
- `tags` — id (serial), slug (unique, citext), label.
- `user_tags` — user_id, tag_id (composite PK).
- `user_pictures` — id, user_id, storage_key, is_profile (bool), position (0–4), created_at. Unique partial index `(user_id) WHERE is_profile = true`.
- `user_locations` — user_id (PK), lat, lng, city, source (`gps` | `manual`), updated_at. PostGIS `POINT` geometry.

---

## API surface
| Method | Route | Description |
|--------|-------|-------------|
| `GET`   | `/api/users/me` | Current user's full profile |
| `PATCH` | `/api/users/me` | Update identity + profile fields |
| `GET`   | `/api/users/me/tags` | Fetch own tags |
| `PUT`   | `/api/users/me/tags` | Replace tag list |
| `POST`  | `/api/users/me/pictures` | Upload a new picture (multipart) |
| `PATCH` | `/api/users/me/pictures/[id]` | Set as profile picture or reorder |
| `DELETE`| `/api/users/me/pictures/[id]` | Remove a picture |
| `PUT`   | `/api/users/location` | Update location (GPS or manual) |
| `GET`   | `/api/users/[id]/avatar` | Proxy storage-backed profile picture |
| `GET`   | `/api/tags?q=` | Autocomplete tag search |

---

## UI
- `/settings` with tabs: **Profile** (identity + bio + gender + preferences), **Pictures**, **Tags**, **Location**, **Security**.
- GPS consent dialog; clear explanation + manual fallback if declined.
- Tag input: autocomplete via `/api/tags?q=`; create new tag on Enter (slugified).
- Picture grid with drag-to-reorder; star button to set profile picture; delete button.

---

## Fame rating
Deterministic formula owned by `FameService.recompute(userId)`:
- +10 per like received.
- −8 per unlike (like removed).
- +2 per unique profile view (capped to 1 per viewer per day).
- +5 per mutual connection.
- Score floored at 0, no upper cap.
- Coefficients documented in `FameService` source; recomputed on: like, unlike, view, block.

---

## Security
- Picture upload: server MIME sniff (magic bytes) + max 5MB; stored under a UUIDv4 key; filename never trusted.
- Biography rendered as plain text (React escaping only).
- Email change: sets `email_verified_at = NULL`, issues new verification token.
- Location with source=`gps` requires explicit browser consent; manual input required otherwise.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| UP-1 | logged-in user | to set my gender and sexual preferences | the app shows me relevant profiles |
| UP-2 | logged-in user | to write a biography | other users can learn about me |
| UP-3 | logged-in user | to add interest tags from a shared list | I can match with people who share my interests |
| UP-4 | logged-in user | to upload up to 5 pictures and choose my profile picture | I control how I appear to others |
| UP-5 | logged-in user | to share my GPS location with consent | the app can suggest nearby matches |
| UP-6 | logged-in user | to provide my city manually if I decline GPS | I can still use matching features without sharing precise location |
| UP-7 | logged-in user | to update any profile field at any time | my profile stays accurate |
| UP-8 | logged-in user | to see who viewed my profile and who liked me | I know who is interested in me |
| UP-9 | any viewer | to see another user's fame rating | I have a signal of their popularity/activity |
| UP-10 | logged-in user | changing my email to trigger re-verification | my address is always confirmed |

---

## Tasks

### Migrations
- [ ] Migration `add-profile-fields-to-users` — add gender (enum), sexual_preferences (enum), biography (text), fame_rating (int default 0), last_seen_at (timestamptz), is_online (bool default false)
- [ ] Migration `create-tags-table` — id serial PK, slug citext unique, label text
- [ ] Migration `create-user-tags-table` — user_id FK, tag_id FK, composite PK
- [ ] Migration `create-user-pictures-table` — id uuid PK, user_id FK, storage_key text, is_profile bool, position int, created_at; unique partial index `(user_id) WHERE is_profile = true`
- [ ] Migration `create-user-locations-table` — PostGIS POINT geometry + city + source enum + updated_at (already present, verify and extend if needed)

### Repository — `UserRepository` (extend)
- [ ] `updateProfile(userId, fields)` — PATCH identity + profile columns
- [ ] `setOnline(userId, isOnline)` — update `is_online`, `last_seen_at`

### Repository — `TagRepository`
- [ ] `search(query)` — `SELECT ... WHERE slug ILIKE $1 LIMIT 20`
- [ ] `findOrCreate(slug, label)` — `INSERT ... ON CONFLICT DO NOTHING RETURNING *`
- [ ] `setUserTags(userId, tagIds[])` — delete old rows, insert new (in transaction)

### Repository — `PictureRepository`
- [ ] `findByUser(userId)` — ordered by position
- [ ] `create(userId, storageKey, position)` — insert
- [ ] `setProfilePicture(userId, pictureId)` — transaction: clear existing `is_profile`, set new one
- [ ] `delete(pictureId, userId)` — ensure ownership; if was profile picture clear it
- [ ] `countByUser(userId)` — enforce ≤ 5 cap in service

### Service — `ProfileService`
- [ ] `getMe(userId)` — assemble full profile DTO
- [ ] `updateMe(userId, dto)` — validate, call UserRepository; if email changed call AuthService to re-issue verification
- [ ] `setTags(userId, slugs[])` — findOrCreate each tag, setUserTags
- [ ] `uploadPicture(userId, file)` — MIME check, size check, save to storage, create DB row
- [ ] `setProfilePicture(userId, pictureId)` — verify ownership, delegate to repo
- [ ] `deletePicture(userId, pictureId)` — verify ownership, delete from storage + DB
- [ ] `updateLocation(userId, payload)` — validate GPS coords or city string, upsert location row

### Service — `FameService`
- [ ] `recompute(userId)` — fetch counts (likes, views, connections), apply formula, update `users.fame_rating`
- [ ] Expose coefficients as named constants; document them in a block comment

### Storage helper (`src/lib/storage.ts`)
- [ ] `store(key, buffer, mimeType)` — write to local `public/uploads/` (or S3 if configured)
- [ ] `remove(key)` — delete from storage
- [ ] `publicUrl(key)` — return URL served through `/api/users/[id]/avatar`

### Routes
- [ ] `GET  /api/users/me` — return `ProfileService.getMe`
- [ ] `PATCH /api/users/me` — parse body, call `ProfileService.updateMe`
- [ ] `GET/PUT /api/users/me/tags` — get and replace tag list
- [ ] `POST /api/users/me/pictures` — multipart upload
- [ ] `PATCH /api/users/me/pictures/[id]` — set profile / reorder
- [ ] `DELETE /api/users/me/pictures/[id]`
- [ ] `PUT /api/users/location`
- [ ] `GET /api/users/[id]/avatar` — proxy storage key to response
- [ ] `GET /api/tags?q=` — tag autocomplete

### UI
- [ ] `/settings/profile` tab — form with gender, preferences, bio, first/last name, email
- [ ] `/settings/pictures` tab — upload zone, picture grid, set-profile-picture star, delete, position drag
- [ ] `/settings/tags` tab — tag autocomplete input, badge list, remove
- [ ] `/settings/location` tab — GPS consent button, manual city fallback, map preview (optional)
- [ ] `/settings/security` tab — change password form
- [ ] Onboarding gate: redirect to `/settings` if profile incomplete before accessing `/browse`

### Validation schemas
- [ ] `updateProfileSchema` — optional fields, biography max 500 chars
- [ ] `tagSlugsSchema` — array of 1–50 slugs, each 2–30 chars alphanumeric+hyphen
- [ ] `locationSchema` — GPS `{ lat, lng }` OR manual `{ city }` (one required)

### Tests
- [ ] Unit: `ProfileService.uploadPicture` — MIME rejection, size rejection, happy path
- [ ] Unit: `ProfileService.setTags` — creates missing tags, replaces set
- [ ] Unit: `FameService.recompute` — correct score given known like/view/connection counts
- [ ] Unit: `ProfileService.updateMe` — email change triggers token re-issue

---

## Acceptance criteria
- All required fields validated server-side (`src/server/schemas`).
- Profile picture constraint enforced at DB (unique partial index).
- Tags are case-insensitive and reused across users.
- Fame rating is publicly visible on profiles; updates reactively after like/unlike/view.
- Location is always present post-onboarding (GPS or manual), enforced before granting access to browsing.

---

## Open questions
- Storage backend (local vs. object storage) — current code uses an avatar route pattern; confirm at build time and update this PRD.
