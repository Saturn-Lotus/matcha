# PRD 02 — User Profile

## Context
Subject §IV.2. After login, users complete a profile that powers matching, browsing, and profile views.

---

## Scope
Required fields (editable at any time):
- Gender.
- Sexual preferences (heterosexual / homosexual / bisexual). Default = bisexual if unset.
- Biography (free text, length-bounded).
- Interests as a free-text array stored on the profile (e.g. `["vegan", "hiking"]`). Not a shared tag table — plain `text[]` column on `user_profiles`.
- Up to 5 pictures stored as storage keys in a `text[]` column on `user_profiles`; one key designated as `avatarUrl` (the profile picture).
- Editable identity fields: first name, last name, email (email change issues a new verification to the pending address; the live `email` field is not updated until the user clicks the link).
- Location: GPS with explicit consent; manual fallback (city/neighborhood) if declined. User can modify location any time.

Profile read surface:
- Fame rating (public, computed — see "Fame rating" below).
- "Who viewed me" list (populated by PRD 05).
- "Who liked me" list (populated by PRD 05).

## Out of scope
- Photo gallery with drag-and-drop editing (bonus, PRD 08).
- Interactive map of users (bonus, PRD 08).
- Shared/reusable tag taxonomy across users (dropped — interests are free text on the profile).

---

## Data model

### Already implemented
- `users` — id, username, email, pendingEmail, passwordHash, isVerified, createdAt, updatedAt.
- `user_profiles` — userId (PK), firstName, lastName, bio (nullable), gender (nullable enum), sexualPreference (nullable enum), avatarUrl (nullable text), interests (nullable text[]), pictures (nullable text[]), isProfileComplete (bool), createdAt, updatedAt.
- `user_locations` — userId (PK), location (PostGIS POINT), city, locationType (enum), consentGiven (bool), updatedAt.

### Needs migration
- `user_profiles` — add: `fameRating` (float, NOT NULL, default 0), `lastSeenAt` (timestamptz, nullable), `isOnline` (bool, NOT NULL, default false).

---

## API surface
| Method | Route | Description |
|--------|-------|-------------|
| `GET`   | `/api/users/profiles/[id]` | Full profile for authenticated user |
| `PATCH` | `/api/users/profiles/[id]` | Update identity + profile fields (multipart) |
| `PATCH` | `/api/users/location` | Update location (GPS or manual) |
| `GET`   | `/api/users/[id]/avatar` | Proxy storage-backed profile picture |
| `GET`   | `/api/tags?q=` | Interest autocomplete (prefix search over distinct values already in `user_profiles.interests`) |

---

## UI
- `/settings` with tabs: **Profile** (identity + bio + gender + preferences), **Pictures**, **Interests**, **Location**, **Security**.
- GPS consent dialog; clear explanation + manual fallback if declined.
- Interest input: client-side autocomplete from `/api/tags?q=`; add new value on Enter (trimmed, lowercased). Rendered as a badge list with remove buttons.
- Picture grid: upload zone, trash button to delete, star button to set as profile picture (`avatarUrl`). Up to 5 pictures enforced.

---

## Fame rating
**Status: DEFINED — implemented in `FameService` (`src/server/services/fame.ts`).**

```
fame = max(0, view_count * VIEW_WEIGHT + active_likes_count * LIKE_WEIGHT)
```

| Constant | Value | Signal |
|---|---|---|
| `VIEW_WEIGHT` | 1 | unique profile view |
| `LIKE_WEIGHT` | 5 | active like (unlike removes it, cancelling its weight) |

- Score floored at 0, no upper cap.
- Recomputed on: like, unlike, profile view. Blocks and matches deferred.
- Cached in `user_profiles.fameRating` (float); publicly visible on profile cards.

---

## Security
- Picture upload: server MIME sniff (magic bytes) + max 5 MB; stored under a UUIDv4 key; filename never trusted.
- Biography rendered as plain text (React escaping only).
- Email change: stores new address as `pendingEmail`, issues verification email to that address, does **not** update `users.email` until the user clicks the link.
- Location with `locationType = gps` requires explicit browser consent; manual input required otherwise.
- Password change: old password must be verified with `bcrypt.compare` before storing the new hash.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| UP-1 | logged-in user | to set my gender and sexual preferences | the app shows me relevant profiles |
| UP-2 | logged-in user | to write a biography | other users can learn about me |
| UP-3 | logged-in user | to add interest tags from a free-text list | I can match with people who share my interests |
| UP-4 | logged-in user | to upload up to 5 pictures and choose my profile picture | I control how I appear to others |
| UP-5 | logged-in user | to share my GPS location with consent | the app can suggest nearby matches |
| UP-6 | logged-in user | to provide my city manually if I decline GPS | I can still use matching features without sharing precise location |
| UP-7 | logged-in user | to update any profile field at any time | my profile stays accurate |
| UP-8 | logged-in user | to see who viewed my profile and who liked me | I know who is interested in me |
| UP-9 | any viewer | to see another user's fame rating | I have a signal of their popularity/activity |
| UP-10 | logged-in user | changing my email to trigger re-verification | my address is always confirmed |
| UP-11 | logged-in user | to change my password from settings | I can keep my account secure |

---

## Tasks

### Migrations
- [ ] Migration `add-online-status-and-fame-to-user-profiles` — add `fameRating float NOT NULL default 0`, `lastSeenAt timestamptz`, `isOnline bool NOT NULL default false` to `user_profiles` *(file created, pending DB order issue)*

### Repository — `UserRepository` (extend)
- [ ] `setOnline(userId, isOnline)` — update `is_online`, `last_seen_at`

### Service — `FameService`
- [x] `recompute(userId)` — fetch view/like counts, apply formula, update `user_profiles.fameRating`
- [x] Expose coefficients as named constants (`VIEW_WEIGHT`, `LIKE_WEIGHT`)

### Service — `UserService` (extend)
- [ ] `changePassword(userId, oldPassword, newPassword)` — `bcrypt.compare` old, hash new, call `UserRepository.update`
- [ ] Verify email-change flow end-to-end: `updateUserProfile` already sets `pendingEmail` and sends a verification email; confirm the verification callback updates `users.email` and clears `pendingEmail`
- [ ] Interest autocomplete endpoint: `GET /api/tags?q=` — query distinct values from `user_profiles.interests` with `ILIKE '%q%' LIMIT 20`

### Routes
- [ ] `POST /api/users/[id]/change-password` — parse `{ oldPassword, newPassword }`, call `UserService.changePassword`

### UI
- [ ] `/settings/security` tab — change password form (old password + new password + confirm)
- [ ] Verify `/settings` email field: confirm pending-email state is shown to user after a change

### Validation schemas
- [ ] `changePasswordSchema` — `oldPassword` (string), `newPassword` (string, min 8 chars, zxcvbn score ≥ 2)

---

## Acceptance criteria
- All required profile fields validated server-side.
- Profile picture (`avatarUrl`) always points to one of the keys in `pictures[]`; cleared if that picture is removed.
- Interests stored as lowercased, trimmed strings; duplicates rejected.
- Fame rating publicly visible on profiles; updated after like/unlike/view/block (once formula is defined).
- Location always present post-onboarding (GPS or manual), enforced before granting access to browsing.
- Email change: new address receives a verification link; `users.email` is not updated until confirmed.
- Password change: old password verified before accepting new one.

---

## Open questions
- Storage backend (local vs. Vercel Blob) — currently using Vercel Blob; confirm for production and update this PRD.
