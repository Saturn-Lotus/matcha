# PRD 04 — Research (Advanced Search)

## Context
Subject §IV.4. Dedicated search experience with explicit filter selection, distinct from the default suggestion feed.

---

## Scope
User picks one or more criteria:
- Age range (min/max years).
- Fame rating range (min/max).
- Location (city string or coordinates + radius in km).
- One or more interest tags (AND semantics — user must have ALL selected tags).

Results are sortable and filterable by the same axes as browsing (age, distance, fame, tags).  
At least one criterion must be provided (no full-table browse).

## Out of scope
- Free-text name/bio search.
- Saved searches.

---

## Data model
No new tables. Reuses PRD 02/03 schema.  
Consider covering index: `(birthdate, fame_rating)` on `users`.

---

## API surface
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/users/search` | Explicit advanced search, same response shape as suggestions |

Query params (all optional but at least one required): `minAge`, `maxAge`, `minFame`, `maxFame`, `location` (city or `lat,lng`), `radius` (km), `tags` (comma-separated), `sort`, `order`, `cursor`, `limit`.

Same response shape as `/api/users/suggestions`.

---

## UI
- `/search` page with a visible form above results.
- Age range slider (min/max), fame range slider, location input + radius slider, tag multi-select autocomplete.
- URL-synced filters — changing filters updates query params so results are shareable and survive back-button.
- Same `ProfileCard` component as browsing (reuse, no duplication).
- Empty state when no results; validation error when no criterion given.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| SR-1 | logged-in user | to search by a specific age range | I find people of the ages I prefer |
| SR-2 | logged-in user | to search by fame rating range | I find users at a certain activity level |
| SR-3 | logged-in user | to search by location + radius | I find people in a specific area |
| SR-4 | logged-in user | to search by one or more tags (AND) | I find people who share all my listed interests |
| SR-5 | logged-in user | to combine multiple criteria in one search | I get precisely targeted results |
| SR-6 | logged-in user | to sort and filter the search results | I can explore the result set further |
| SR-7 | logged-in user | the search URL to be shareable | I can bookmark or share my exact search |
| SR-8 | logged-in user | an error when I submit empty filters | I understand that a criterion is required |

---

## Tasks

### Repository — `SearchRepository`
- [ ] `search(viewerId, filters, sort, cursor, limit)` — adapts the same base query as `SuggestionRepository.list` but:
  - Applies user-supplied explicit filters (no orientation pre-filtering by default; still blocks excluded)
  - Tag filter uses `HAVING COUNT(DISTINCT tag_id) = $tagCount` for AND semantics
  - Location filter: if `lat/lng` provided use `ST_DWithin`; if city string provided resolve to coords via geocode or text match on `user_locations.city`
- [ ] Share a common query builder function with `SuggestionRepository` to avoid duplicated SQL

### Service — `SearchService`
- [ ] `search(viewerId, query)` — require at least one criterion (throw `NoCriteriaProvided` 400), validate ranges, call repository, map to DTO
- [ ] `parseLocationInput(input)` — string `"Paris"` → geocode to lat/lng OR `"48.85,2.35"` → parse directly
- [ ] Reuse `SuggestionService.resolveOrientation` for optional orientation gating (search still respects blocks)

### Route
- [ ] `GET /api/users/search` — parse query params, call `SearchService.search`, return paginated response
- [ ] Return 400 `NoCriteriaProvided` when all filter params absent
- [ ] Protect with auth middleware

### UI
- [ ] `/search` page with a `SearchForm` component — age, fame, location+radius, tag fields; "Search" submit button
- [ ] URL sync via `useSearchParams` + `router.push` on form submit
- [ ] Reuse `ProfileCard` from browsing
- [ ] Reuse `SortControl` from browsing
- [ ] Show "No results" with a different message than browsing (user explicitly searched, not a filter mismatch)
- [ ] Show inline validation: "Please enter at least one criterion"

### Validation schemas
- [ ] `searchSchema` — extends browsing filters; at-least-one check; min ≤ max checks; radius 1–500 km

### Tests
- [ ] Unit: `SearchService.search` — no criteria → 400, tag AND semantics, location string parsing
- [ ] Unit: `SearchRepository.search` — tag AND filter returns only users with all tags
- [ ] E2E (Cypress): fill tag + age → submit → results shown; clear all fields → submit → validation message

---

## Acceptance criteria
- Search respects gender/orientation gating (same as browsing; blocked users excluded).
- Empty criteria returns 400 (not a full-table scan).
- Tag filter applies AND semantics; case-insensitive.
- Results paginated; URL params survive page reload.
- Ranges validated server-side (min ≤ max; caps enforced).

---

## Security
- Validate all ranges server-side (min ≤ max; reasonable caps: age 18–99, fame 0–9999, radius 1–500). Reject malformed inputs with 400.
