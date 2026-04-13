# Matcha — Project Rules for Claude

## Stack
- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Database:** PostgreSQL via `pg`, managed with `node-pg-migrate`
- **Auth:** bcrypt for hashing, `jose` for JWT sessions
- **Styling:** Tailwind CSS v4, Radix UI primitives, shadcn/ui components
- **Testing:** Jest (unit), Cypress (e2e)
- **Runtime:** Bun (lockfile), Node.js

## Project Structure
```
src/
  app/          # Next.js App Router — pages and API routes
  lib/          # Shared utilities (auth, mailer, api client, exception mapper, validator)
  server/       # Server-only code
    db/         # PostgreSQL connection (postgres.ts)
    repositories/   # Data access layer (extend BaseRepositoryClass)
    services/       # Business logic (e.g. AuthService)
    schemas/        # Validation schemas
    factories/      # Service/repo factory functions (use these in routes)
  middlewares/  # Route middlewares (e.g. withErrorHandler)
  types/        # Shared TypeScript types
```

## Architecture Rules

### Layered architecture — each layer owns exactly one concern

The codebase is strictly layered: **Route → Service → Repository**. Each layer only depends on the one directly below it. Logic must never leak up or down.

| Layer | Owns | Must never contain |
|---|---|---|
| Route | HTTP: parse request, call service, return response | Business logic, crypto, SQL, transaction management |
| Service | Use-case logic: validation, transformation, orchestration, crypto | Raw SQL, `new PostgresDB()`, direct repo instantiation |
| Repository | Data access: SQL queries, atomicity (transactions) | Business rules, HTTP concerns |

A rule of thumb: if you find yourself writing `bcrypt`, `db.transaction`, or raw SQL in a route, it belongs one layer down. If you find yourself writing HTTP status codes or `NextResponse` in a service, it belongs one layer up.

### Routes
- Thin by design: parse input → call one service method → return response.
- Wrap every handler with `withErrorHandler`. Never manually catch errors.
- Never instantiate services or repositories directly — use factories from `src/server/factories`.
- Do not import unused identifiers.

### Services
- One method per use-case. The method encapsulates everything needed to complete the operation end-to-end.
- Receive all dependencies (repositories, other services) via constructor injection.
- Define domain errors in the service file using `@HTTPError(statusCode)`.

### Repositories
- Extend `BaseRepositoryClass<T>` from `src/server/repositories/base.ts`.
- One repository per aggregate. Methods map 1:1 to DB operations.
- When an operation requires multiple writes to be atomic, encapsulate it in a dedicated repository method that owns the transaction internally — callers never manage transactions.
- Prefer passing the transactional `db` as an optional parameter to existing methods over duplicating query logic.

### Error Handling
- Define domain errors in the relevant service file using `@HTTPError(statusCode)` decorator.
- `withErrorHandler` catches these and returns the appropriate HTTP response automatically.
- Do not manually catch and re-throw errors in routes.

## Crypto / Security Rules
- **Never** use `bcrypt.hash` to look up records in the DB. bcrypt uses a random salt — the output differs every call.
- Always use `bcrypt.compare(plaintext, storedHash)` to verify bcrypt-hashed values.
- For token-based lookups, query by a non-hashed field (e.g. `userId` + `tokenType`), then verify the token with `bcrypt.compare`.
- Verification links must include the `userId` (`?token=...&id=...`) so the record can be fetched before comparison.
- Never store raw tokens in the database — always store the bcrypt hash.

## Database
- Migrations live in `migrations/` and are managed with `node-pg-migrate`.
- Run migrations: `npm run db:migrate`
- Create a migration: `npm run db:create <name>`
- Do not alter the DB schema outside of migration files.
- The migration files should be in raw sql using pgm.sql, not using the helper methods (e.g. pgm.createTable) — this ensures the SQL is explicit and clear.

## Frontend Rules
- Use shadcn/ui components and Radix primitives for all UI elements — do not create custom components unless necessary.
- Tailwind CSS for styling — no custom CSS files or inline styles.
- Use Next.js App Router conventions for page and API route structure.
- Use zustand for state management if needed — avoid prop drilling but do not overuse global state.
- The app must be compatible with the latest versions of Chrome and Firefox — no experimental features that lack broad support.
- The app should be responsive and mobile-friendly, focus on mobile-first design.


## Code Style
- Use `async/await` — no raw `.then()` chains.
- Prefer named exports. Default exports only for Next.js page/route conventions.
- Do not add comments unless the logic is non-obvious.
- Do not add error handling for scenarios that cannot happen.
- TypeScript strict mode is on — no `any` unless absolutely necessary.

## Commands
| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Lint fix | `npm run lint:fix` |
| Format | `npm run format` |
| Migrate DB | `npm run db:migrate` |
| Unit tests | `npx jest` |
| E2E tests | `npm run cy:open` |
