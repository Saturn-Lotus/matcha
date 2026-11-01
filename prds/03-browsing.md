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
- Suggestions require the viewer to have a stored location (GPS or a manually typed city/neighborhood geocoded on save). Without one, `GET /api/users` returns 400 "Set your location in settings to see suggestions".
- Intelligent ranking across multiple criteria simultaneously (default `relevance` sort):
  - Same geographical area first: candidate city equals viewer city (case-insensitive). Exposed as a selected `areaBand` column (0 = same city, 1 = otherwise, including missing city on either side).
  - Then number of shared tags (DESC).
  - Then fame rating (DESC).
  - Then distance (ASC, nulls last), then `id` as a stable tie-break.
- Sortable by: age, distance, fame rating, shared-tag count.
- Filterable by: age range, distance radius, fame rating range, tags, city (see PRD 04).
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
| BR-2 | logged-in user | profiles in my city to be shown first | I see people I could realistically meet |
| BR-3 | logged-in user | profiles with more shared interests to rank higher | my matches are more relevant |
| BR-4 | logged-in user | to filter results by age range | I see only the ages I'm interested in |
| BR-5 | logged-in user | to filter by maximum distance | I only see people close to me |
| BR-6 | logged-in user | to filter by fame rating | I can narrow to active / popular users |
| BR-7 | logged-in user | to filter by one or more tags | I can find people with specific interests |
| BR-8 | logged-in user | to sort the list by age, distance, fame, or shared tags | I can explore the list in different ways |
| BR-9 | logged-in user | blocked users to never appear in suggestions | I don't see people I've blocked |
| BR-10 | logged-in user | the list to load more cards as I scroll | I can browse a large pool without pagination UI |
| BR-11 | logged-in user | a celebratory "It's a Match!" overlay when I like someone who already liked me | I get immediate feedback that a mutual connection formed |

---

## Tasks

### Repository — `UserRepository.getUsersWithProfiles` (suggestions live here for now)
- [x] Filter by viewer's allowed candidate genders (`gender = ANY($2)`) and exclude the viewer themself — implements **BR-1**
- [ ] Replace with a dedicated `SuggestionRepository.list(viewerId, filters, sort, cursor, limit)` once distance/tags/fame ranking lands. Will use:
  - `ST_Distance` (PostGIS) for distance calculation
  - Left join `likes` to exclude already-liked users (optional; or keep them but mark)
  - Join `user_tags` intersection count for shared tags
  - `WHERE` clause filters out: the viewer, blocked users (both directions) ✓ already implemented via `NOT EXISTS` on `user_blocks`, unverified / incomplete profiles
  - `ORDER BY` based on `sort` param; tie-break on `user_id` for determinism
  - Cursor pagination via `WHERE (distance, user_id) > (cursor_distance, cursor_id)`

### Service — `UserService` (will move to `SuggestionService` later)
- [x] `resolveOrientation(sexualPreference)` — determine allowed candidate genders; null preference is treated as `'both'` (per scope) — implements **BR-1**
- [x] `getUsersWithProfiles(viewerId)` — fetch viewer profile, resolve allowed genders, call repository, map to `BrowseSuggestion` DTO
- [x] `getUsersWithProfiles` always requires a stored viewer location (`userHasLocation`), throwing `ValidationError` otherwise
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
- [x] `MatchCelebration` overlay — when a like in the feed becomes mutual (the viewer is the second to like), the `POST /api/users/[id]/likes` response returns `matched: true` and a full-screen branded "It's a Match!" overlay fires showing both avatars + a CTA to `/matches` — implements **BR-11**

### Indexes (migration)
- [x] Migration `add-browsing-indexes` — btree on `user_profiles."fameRating"` DESC, btree on `user_profiles."birthDate"` (GIST on `user_locations.location` already shipped in earlier migration)

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
- A viewer without a stored location gets 400, never an unranked list.
- Default relevance order is `"areaBand" ASC, "sharedTagCount" DESC, "fameRating" DESC, "distanceKm" ASC NULLS LAST, id ASC`.
- Default sort gives visibly better matches than `ORDER BY user_id`.
- Pagination cursor works: second page never repeats first-page items.

---

## Audit findings (subject v6.1, 2026-07-16)
- Orientation matching is correct **both directions** with bisexual default for unset preference (`resolveOrientation` + the candidate-preference SQL clause). Viewer must have a gender set.
- Relevance sort is `ORDER BY "areaBand" ASC, "sharedTagCount" DESC, "fameRating" DESC, "distanceKm" ASC NULLS LAST, id ASC`. Previously distance led the order, and because it is a continuous float, shared tags and fame almost never mattered. Same city is now an explicit band, so tags and fame decide the order within an area.
- All four sorts (age, distance, fame, shared tags) and five filters (age, distance, fame, tags, city) are implemented. Filters are sourced from persisted search preferences (see [[04-research]]), not an on-feed filter panel.
- Pagination is **offset-based** (`page`/`pageSize`, `COUNT(*) OVER ()`), not the cursor scheme this PRD describes — update the PRD text or the impl to match. Infinite scroll is wired on top.
- **Fame filter ceiling (100) < unbounded fame formula** — carries the [[02-user-profile]] fame-scale bug into browse: filtering fame ≤ 100 hides all high-fame profiles.

## Open questions
- Ranking weights — defined in `SuggestionService` constants; tune after seed data is available.
- Page size default: 20.
- Reconcile PRD's cursor-pagination spec with the shipped offset pagination.
