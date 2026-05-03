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
- [ ] Confirm `withErrorHandler` is applied on every existing route handler
- [ ] Add a global error boundary component for unexpected client-side throws
- [ ] Audit all existing API routes: any route missing `withErrorHandler` → fix it
- [ ] Add a 404 page (`app/not-found.tsx`) and a 500 fallback (`app/error.tsx`)

### Layout shell
- [ ] Implement persistent `<Header>` with nav links and auth controls (login/logout, notification bell, chat badge)
- [ ] Implement `<Footer>` with static content
- [ ] Verify header + footer render on every public and authenticated route
- [ ] Mobile-first media queries verified in Chrome DevTools at 375px, 768px, 1280px

### Database seed
- [ ] Write `scripts/seed.ts` — generates 500 unique users with randomised gender, preferences, location, tags, pictures, and computed fame rating
- [ ] Seed is idempotent (uses `ON CONFLICT DO NOTHING` or explicit upsert)
- [ ] Add `"db:seed": "bun run scripts/seed.ts"` to `package.json`
- [ ] Verify seed runs cleanly on a fresh database after all migrations

### Security baseline
- [ ] Audit all repository methods — every interpolated value uses `$N` parameterised syntax
- [ ] Add `Content-Security-Policy` and `X-Content-Type-Options` headers via Next.js config
- [ ] File upload helper validates MIME via magic bytes (not just extension) and rejects > 5MB
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
