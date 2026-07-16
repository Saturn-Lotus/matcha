# PRD 00 — Cross-cutting Constraints

## Context
Subject-wide constraints that apply to every feature. These are mandatory and evaluated at defense.

---

## Requirements

### Errors
- No unhandled errors server- or client-side. Every legitimate error case returns an appropriate HTTP status and is rendered gracefully.
- Never expose stack traces. Use `withErrorHandler` + `@HTTPError` domain errors (see `CLAUDE.md` → Error Handling).

### Stack (project-fixed, already chosen)
- Next.js 15 App Router, React 19, TypeScript strict.
- PostgreSQL via `pg`, raw SQL only (no ORM). Migrations via `node-pg-migrate`, authored with `pgm.sql`.
- bcrypt for hashing; `jose` for JWT sessions.
- Tailwind v4, Radix, shadcn/ui. No custom CSS or inline styles.
- Bun as package manager (`bun add`, `bun run`).

### Layout & responsiveness
- Every page has a header, main, and footer.
- Mobile-first; must stay usable on small screens.
- Must run on latest Chrome and Firefox.

### Database seed
- ≥500 distinct seed profiles must be available for evaluation. Seed script in `scripts/` that is idempotent and invoked after migrations.

### Security (baseline — any breach = score 0)
- Passwords: bcrypt hashing only; reject dictionary passwords (zxcvbn, already integrated).
- No SQL injection — always parameterized queries through the repository layer.
- No HTML/JS injection — React escapes by default; never use `dangerouslySetInnerHTML` on user content.
- File uploads: validate MIME and size, store outside the DB or as binary with strict checks, never trust client-provided filenames.
- All secrets live in `.env*` (already gitignored).
- Validate every form input on both client (UX) and server (authority). Server validation lives in `src/server/schemas`.

### Architecture (non-negotiable)
- Route → Service → Repository layering. See `CLAUDE.md`.
- Routes wrapped with `withErrorHandler`, use factories, no direct instantiation.
- Client components never decode JWTs.
- Pages/layouts never call repos/services directly — they go through API routes or read session.

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| CC-1 | visitor | every broken action to show a clear message instead of a crash | I know what went wrong without seeing a stack trace |
| CC-2 | developer | all secrets stored in `.env` | they are never accidentally committed |
| CC-3 | tester | lint and tests to pass in CI | I can trust the build is clean |
| CC-4 | mobile user | every page to be usable on a small screen | I can use the app on my phone |
| CC-5 | evaluator | ≥500 seeded profiles to be present | I can verify browsing/search at scale |

---

## Tasks

### Foundation
- [x] Confirm `withErrorHandler` is applied on every existing route handler
- [x] Add a global error boundary component for unexpected client-side throws (`app/error.tsx`)
- [x] Audit all existing API routes: any route missing `withErrorHandler` → fix it (only the static `/api` health route lacks it — it cannot throw)
- [x] Add a 404 page (`app/not-found.tsx`) and a 500 fallback (`app/error.tsx`)

### Layout shell
- [ ] Implement persistent `<Header>` with nav links and auth controls (login/logout, notification bell, chat badge)
- [ ] Implement `<Footer>` with static content
- [ ] Verify header + footer render on every public and authenticated route
- [ ] Mobile-first media queries verified in Chrome DevTools at 375px, 768px, 1280px

### Database seed
- [x] Seed of 500 unique users — `scripts/seed_users.sql` (PL/pgSQL loop: randomised gender, preferences, location around Paris, 3–5 tags, 2–4 photos, fame 10–500, verified + complete profiles) run via `scripts/seed_users.sh` (loads `.env`, `psql`, supports `--clean`); also seeds a `testuser` with matches/likes/views
- [ ] Verify seed runs cleanly on a fresh database after all migrations (requires `pgcrypto` + `uuid-ossp` extensions)

### Security baseline
- [ ] Audit all repository methods — every interpolated value uses `$N` parameterised syntax
- [ ] Add `Content-Security-Policy` and `X-Content-Type-Options` headers via Next.js config
- [x] File upload helper validates MIME via magic bytes (not just extension) and rejects > 5MB — `assertImageSignature` in `src/lib/validator/parsers.ts`, enforced in `UserService` before every `bulkUploadFiles` call (PNG/JPEG/WEBP signatures)
- [ ] Add server-side `zxcvbn` check in `AuthService` (client-only is not enough)

### Testing infrastructure
- [ ] Jest config covers `src/server/services/**` with at least one test per service
- [ ] Add a Cypress smoke test verifying header/footer presence on the home page
- [ ] `bun run lint` passes with zero warnings in CI

---

## Acceptance criteria
- Lint passes (`bun run lint`).
- Unit tests for every service method (`npx jest`).
- No console errors on any happy path in the browser.
- Peer-evaluation security checklist fully covered.

---

## Audit findings (subject v6.1, 2026-07-16)

Full static audit of merged `main`. Verified: `bun run lint` → 0 errors / 1 pre-existing warning (`carousel.tsx:98`, untouched); `bun x tsc --noEmit` clean; `bun x jest` → 70 passed, 25 integration tests skipped (need `INTEGRATION_TESTS=1` + DB).

**Security (score-0 gates)**
- ✅ Passwords bcrypt cost 10; seeds use pgcrypto bcrypt — no plaintext stored.
- ✅ SQL: all repository queries parameterized. Only internal constants (`${this.table}`, allow-listed `ORDER BY` fragments validated by `Su.literal`) are interpolated. One dead `UserTokensRepository.update` interpolates values but has no callers — **recommend deleting it** to remove the footgun.
- ✅ XSS: no `dangerouslySetInnerHTML` anywhere; JSX escaping throughout.
- ✅ Uploads: magic-byte signature check + 5 MB cap + UUID object keys (filenames untrusted).
- ✅ **Profile-write IDOR fixed** (see [[02-user-profile]]) and **session cookie hardened** (see [[01-registration-signin]]).
- ⚠️ `.env.example` is tracked and contains real-looking `SESSION_SECRET` / `SALT` base64 values. Even as examples these should be obvious placeholders — **rotate/blank them** so a copy-paste deploy can't inherit a public secret.
- ⚠️ No rate limiting on auth endpoints; no CSRF token (mitigated by `sameSite=lax` + JSON-only mutations, but `GET /api/auth/logout` and `GET /api/auth/verify` are state-changing GETs).

**Unhandled-rejection sweep (subject: "no unhandled errors")** — fire-and-forget async without `.catch`/try-catch, worst first:
1. `profile-view.tsx:67` — `POST /users/[id]/views`
2. `notifications/page.tsx` — `loadInitial` / `loadMore` (try/finally, no catch)
3. `matches-content.tsx` / `social-grid.tsx` — `loadMore` (try/finally, no catch)
4. `navigation-bar.tsx` — `handleLogout` async onClick, no try/catch

These do not surface a stack trace to the user (React error boundary + axios reject), but they are unhandled rejections and should be wrapped. **Open.**

**Housekeeping**
- `README.md` is untouched `create-next-app` boilerplate — documents none of the socket server, compose, migrations, env, or bun scripts. **Rewrite before defense.**
- `compose.yaml` defines a `neo4jDb` service that nothing in `src/` uses — remove or document.
- `Dockerfile` uses `npm i`/`npm run` while the project standard is Bun (`bun.lock` present). Align to avoid lockfile drift.
- One `console.log` in `src/server/storage/minio.ts:57` (bucket bootstrap) — downgrade to `console.error` or remove.
