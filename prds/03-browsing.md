# PRD 03 — Browsing (Suggested Profiles)

## Context
Subject §IV.3. Users land on a feed of "interesting" profiles that match their preferences.

---

## Scope
- Respect sexual preferences (reciprocal — both sides must be compatible):
  - Heterosexual woman → sees only men; heterosexual man → sees only women.
  - Homosexual → same gender only.
  - Bisexual (or unset → treated as bisexual) → both genders.
  - A candidate is only shown if their own `sexualPreference` includes the viewer's gender (null preference is treated as `'both'`).
- Intelligent ranking across multiple criteria simultaneously:
  - Proximity to the viewer's location (highest priority).
  - Number of shared tags.
  - Fame rating.
- Sortable by: age, distance, fame rating, shared-tag count.
- Filterable by: age range, distance radius, fame rating range, tags.
- Pagination (cursor-based).

## Out of scope
- Free-text / advanced search (see PRD 04).

---

## Data model
No new tables. Reuses PRD 02 models.  
Add indexes (if not already present):
- `GIST` index on `user_locations.geom` for PostGIS distance queries.
- `btree` on `users.fame_rating DESC`.
- `btree` on `users.birthdate` for age sort.

---

## API surface
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/users/suggestions` | Paginated suggested profiles |

Query params: `sort` (age\|distance\|fame\|tags), `order` (asc\|desc), `cursor`, `minAge`, `maxAge`, `maxDistance` (km), `minFame`, `maxFame`, `tags` (comma-separated slugs), `limit` (default 20).

Response item: `{ id, username, firstName, age, distanceKm, fameRating, sharedTagCount, previewPictureUrl, isOnline, lastSeenAt }`.

---

## UI
- `/browse` — infinite-scroll card grid.
- Filter panel (collapsible on mobile): age range, distance radius, fame range, tag multi-select.
- Sort dropdown with direction toggle.
- Empty state with suggestion to widen filters.
- Card shows: profile picture, name, age, distance, fame, shared tag count, online badge.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| BR-1 | logged-in user | to see a list of profiles that match my gender preference | I don't waste time on irrelevant profiles |
| BR-2 | logged-in user | nearby profiles to be shown first | I see people I could realistically meet |
| BR-3 | logged-in user | profiles with more shared interests to rank higher | my matches are more relevant |
| BR-4 | logged-in user | to filter results by age range | I see only the ages I'm interested in |
| BR-5 | logged-in user | to filter by maximum distance | I only see people close to me |
| BR-6 | logged-in user | to filter by fame rating | I can narrow to active / popular users |
| BR-7 | logged-in user | to filter by one or more tags | I can find people with specific interests |
| BR-8 | logged-in user | to sort the list by age, distance, fame, or shared tags | I can explore the list in different ways |
| BR-9 | logged-in user | blocked users to never appear in suggestions | I don't see people I've blocked |
| BR-10 | logged-in user | the list to load more cards as I scroll | I can browse a large pool without pagination UI |

---

## Tasks

### Repository — `UserRepository.getUsersWithProfiles` (suggestions live here for now)
- [x] Filter by viewer's allowed candidate genders (`gender = ANY($2)`) and exclude the viewer themself — implements **BR-1**
- [x] Compute `ST_Distance` between viewer and candidate locations and `ORDER BY distance ASC NULLS LAST, user_id ASC` — implements **BR-2**
- [ ] Replace with a dedicated `SuggestionRepository.list(viewerId, filters, sort, cursor, limit)` once distance/tags/fame ranking lands. Will use:
  - `ST_Distance` (PostGIS) for distance calculation
  - Left join `likes` to exclude already-liked users (optional; or keep them but mark)
  - Join `user_tags` intersection count for shared tags
  - `WHERE` clause filters out: the viewer, blocked users (both directions), unverified / incomplete profiles
  - `ORDER BY` based on `sort` param; tie-break on `user_id` for determinism
  - Cursor pagination via `WHERE (distance, user_id) > (cursor_distance, cursor_id)`

### Service — `UserService` (will move to `SuggestionService` later)
- [x] `resolveOrientation(sexualPreference)` — determine allowed candidate genders; null preference is treated as `'both'` (per scope) — implements **BR-1**
- [x] `getUsersWithProfiles(viewerId)` — fetch viewer profile, resolve allowed genders, call repository, map to `BrowseSuggestion` DTO
- [ ] `list(viewerId, query)` — validate query params, call repository, map to response DTO, compute `previewPictureUrl` via storage helper
- [ ] `validateFilters(query)` — age min ≤ max, distance > 0, fame min ≤ max

### Route
- [x] `GET /api/users` — pulls `x-user-id` from middleware-injected header, calls service, returns suggestions (current placeholder until `/api/users/suggestions` is introduced)
- [ ] `GET /api/users/suggestions` — parse + validate query params, call service, return 200 + paginated response
- [ ] Protect with auth middleware; return 401 if not logged in
- [ ] Return 400 for invalid filter values

### UI Components
- [ ] `ProfileCard` component — picture, name, age, distance, fame, tag count, online badge; link to `/users/[id]`
- [ ] `FilterPanel` component — age range (shadcn Slider), distance slider, fame range, TagMultiSelect
- [ ] `SortControl` component — dropdown + asc/desc toggle
- [ ] `/browse` page — assembles `FilterPanel`, `SortControl`, infinite-scroll grid using IntersectionObserver
- [ ] Zustand slice `useBrowseStore` — holds current filters, sort, cursor, results list; actions: setFilter, loadMore, reset
- [ ] Empty state component with CTA to widen filters

### Indexes (migration)
- [x] Migration `add-browsing-distance-index` — GIST on `user_locations.location` — implements **BR-2**
- [ ] Migration `add-browsing-indexes` — btree on fame_rating, btree on birthdate

### Tests
- [ ] Unit: `SuggestionService.resolveOrientation` — all 6 gender/preference combos
- [ ] Unit: `SuggestionService.list` — blocked user excluded, incomplete profiles excluded, sort by distance default
- [ ] Integration: repository query returns correct distance ordering with PostGIS
- [ ] E2E (Cypress): browse page shows cards, filter by age reduces results, sort by distance changes order

---

## Acceptance criteria
- Gender/orientation filter is applied server-side; never leaked client-side.
- Blocked users never appear.
- Results are deterministic given same filters + viewer state.
- Default sort gives visibly better matches than `ORDER BY user_id`.
- Pagination cursor works: second page never repeats first-page items.

---

## Open questions
- Ranking weights — defined in `SuggestionService` constants; tune after seed data is available.
- Page size default: 20.
