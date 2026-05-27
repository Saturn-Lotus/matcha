# PRD 04 — Search Preferences & Live Sort

## Context
Subject §IV.4 asks for an advanced search by age, fame rating, location and
interest tags, with sortable and filterable results. Instead of a dedicated
`/search` page, the criteria are persisted as the viewer's **search
preferences** and applied automatically when browsing. A compact sort popover
on the feed lets the viewer re-order results live without leaving discovery.

This keeps one discovery surface, reuses the existing browse pipeline, and
satisfies the requirement that results be both filterable (via persisted
preferences) and sortable (via the popover).

---

## Scope
- Persist four criteria on `user_profiles`: age range, fame rating range,
  maximum distance (km), and interest tags (AND semantics).
- Edit preferences in a new **Search Preferences** section under `/settings`.
- Apply preferences as the default filters on `/browse`.
- Sort popover on the feed exposing the five sort keys (`relevance`,
  `sharedTagCount`, `distance`, `fameRating`, `age`) and the direction
  (`asc`/`desc`).
- Extend the browse endpoint with `minAge` so a real age range is supported.

## Out of scope
- Standalone `/search` page or `SearchForm` component.
- Free-text name/bio search.
- Saved searches, multi-profile preference sets.
- Shareable URLs / URL-synced filters.

---

## Data model
New columns on `user_profiles` (migration
`1779911702313_add-search-preferences-to-user-profiles.js`):

| Column | Type | Notes |
|---|---|---|
| `prefMinAge` | `INT` | nullable; 18..120 enforced server-side |
| `prefMaxAge` | `INT` | nullable; 18..120 enforced server-side |
| `prefMinFame` | `INT` | nullable; 0..100 enforced server-side |
| `prefMaxFame` | `INT` | nullable; 0..100 enforced server-side |
| `prefMaxDistanceKm` | `FLOAT` | nullable; 0..20000 enforced server-side |
| `prefTags` | `TEXT[]` | nullable; max 20 items; AND semantics |

Index: `idx_user_profiles_pref_tags` (GIN on `prefTags`).

---

## API surface
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/users/me/search-preferences` | Returns the viewer's stored prefs |
| `PATCH` | `/api/users/me/search-preferences` | Updates one or more pref fields |
| `GET` | `/api/users` | Browse — now also accepts `minAge` |

`PATCH` body fields are all optional. Sending `null` clears a field; sending a
value updates it. Cross-field validation enforces
`prefMinAge ≤ prefMaxAge` and `prefMinFame ≤ prefMaxFame` (400 otherwise).

---

## UI
- **Settings → Search Preferences** (`/settings#preferences`)
  - Two number inputs for age range, two for fame range, one for max distance.
  - `InterestsPicker` for tags (reuses the existing component).
  - Dedicated "Save Preferences" button with its own toast.
- **Browse feed** (`/browse`)
  - On mount, preferences are loaded server-side and passed into
    `DiscoverFeed`, which uses them to build the first `/api/users` request.
  - `SortPopover` is rendered top-right of the feed viewport
    (`absolute top-4 right-4 z-10`).
  - Changing sort resets the page state and refetches page 1.

---

## User Stories

| # | As a… | I want… | So that… |
|---|---|---|---|
| SR-1 | logged-in user | to set min/max age in my preferences | the feed only shows me people in that range |
| SR-2 | logged-in user | to set min/max fame rating in my preferences | the feed matches my activity expectations |
| SR-3 | logged-in user | to set a maximum distance in my preferences | the feed shows people nearby |
| SR-4 | logged-in user | to pick interest tags I require (AND) | the feed only shows people who share all of them |
| SR-5 | logged-in user | my preferences to persist across sessions | I don't have to reconfigure on every visit |
| SR-6 | logged-in user | to change sort order from inside the feed | I can explore results without going to settings |
| SR-7 | logged-in user | server-side validation of impossible ranges | I get a clear error instead of broken results |

---

## Tasks

### Migration
- [x] `1779911702313_add-search-preferences-to-user-profiles.js` — six columns + GIN index on `prefTags`.

### Schemas — `src/server/schemas/browse.ts`
- [x] Add `minAge` to `BrowseQuerySchema`.
- [x] Add `SearchPreferencesSchema` and `SearchPreferences` type.
- [x] Add `StoredSearchPreferences` row-shape type.

### Repository — `src/server/repositories/user-repository.ts`
- [x] `getUsersWithProfiles`: forward `minAge`; SQL clause
      `AND ($9::INT IS NULL OR "age" >= $9)`.
- [x] `getSearchPreferences(userId)`.
- [x] `updateSearchPreferences(userId, prefs)` using the existing dynamic SET pattern.

### Service — `src/server/services/user.ts`
- [x] Pass `minAge` through `getUsersWithProfiles`.
- [x] `getSearchPreferences(userId)`.
- [x] `updateSearchPreferences(userId, prefs)` with cross-field range checks
      (throws `BadRequestException`).

### Routes
- [x] `GET/PATCH /api/users/me/search-preferences/route.ts` — wrapped in `withErrorHandler`.
- [x] Extend `coerceBrowseQuery` in `src/app/api/users/route.ts` with `minAge`.

### UI
- [x] `src/app/settings/search-preferences-tab.tsx` — new client component.
- [x] Wire into `src/app/settings/settings-form.tsx`: new nav item + section + save handler.
- [x] `src/app/browse/components/sort-popover.tsx` — dropdown menu with two radio groups.
- [x] Update `src/app/browse/page.tsx`, `browse-content.tsx`, and `discover-feed.tsx` to load and apply preferences, and to refetch on sort changes.

### Tests (follow-up)
- [ ] Unit: `UserService.updateSearchPreferences` rejects `prefMinAge > prefMaxAge` and `prefMinFame > prefMaxFame`.
- [ ] Unit: `UserRepository.getUsersWithProfiles` excludes rows with `age < minAge`.
- [ ] Route: `/api/users/me/search-preferences` GET (defaults to nulls) + PATCH (200/400).
- [ ] Cypress: save prefs in `/settings` → land on `/browse` → first request URL includes prefs; toggle sort popover → list refetches.

---

## Acceptance criteria
- Preferences persist on `user_profiles` and survive logout/login.
- `/browse` reads the viewer's preferences on the server and uses them as the
  default filters for the first request.
- Sort popover changes trigger a fresh page-1 fetch with the new
  `sortBy`/`sortDirection`.
- Interest-tag filter applies AND semantics (existing `interests &&` SQL is
  retained; viewer-supplied tags act as required-overlap).
- `minAge` and the existing max-age (`age`) clamp the candidate set to a real
  range; server rejects values outside 18..120.
- Cross-field validation (`prefMinAge ≤ prefMaxAge`,
  `prefMinFame ≤ prefMaxFame`) returns 400.

---

## Security
- All ranges validated server-side (age 18..120, fame 0..100, distance 0..20000).
- Tags array capped at 20 items; each tag is parsed as a string.
- `PATCH /api/users/me/search-preferences` is gated by `x-user-id` (auth
  middleware) — users cannot edit other users' preferences.
- No new sensitive data introduced.
