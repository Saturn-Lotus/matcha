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

### Pages & Layouts
- Pages and layouts are UI boundaries — they may read from the session (via `decrypt`) and derive props, but must never call factories, services, repositories, or storage directly.
- To pass data to a component that requires server resources (e.g. an avatar URL backed by object storage), expose a dedicated API route that acts as a proxy. The page constructs the route URL from session data and passes it as a prop — it never resolves the resource itself.
- The session is the only server-side data source a layout or page may access without going through an API route or a server action.
- Client components (`'use client'`) must never decode or inspect JWTs. If a client component needs identity data (e.g. `userId`), it must receive it as a prop from a parent server component that read it from the session.

### Error Handling
- Define domain errors in the relevant service file using `@HTTPError(statusCode)` decorator.
- `withErrorHandler` catches these and returns the appropriate HTTP response automatically.
- Do not manually catch and re-throw errors in routes.

### Schemas & Types
- Validation schemas live in `src/server/schemas/` and use the `Su` validator from `src/lib/validator`.
- The schema is the single source of truth: never hand-write a TypeScript type that mirrors a schema's shape. Always derive it with `SuInfer<typeof XxxSchema>` and export both from the same file.
- Example (from `src/server/schemas/user.ts`):
  ```ts
  export const UserProfileSchema = Su.object({ /* fields */ });
  export type UserProfile = SuInfer<typeof UserProfileSchema>;
  ```
- Consumers import the inferred type from `@/server/schemas` — they don't redeclare it in `src/server/types.ts`. `src/server/types.ts` is reserved for domain types that don't correspond to a validated payload (e.g. response DTOs, internal row shapes).

### Validation — always use `Su` from `src/lib/validator`
- **All** input validation across the app must go through `Su` (`src/lib/validator`). Never write one-off `typeof`, `instanceof`, or manual range checks at the route or service level.
- URL query params arrive as strings: coerce to the target JS type first (e.g. `Number(raw)`), throw `CheckValidationError` on `NaN`, then pass the coerced value to the schema. See `coerceBrowseQuery` in `src/app/api/users/route.ts` as the canonical pattern.
- If a new type constraint is needed (e.g. a regex, a custom range), add a method to the appropriate parser class in `src/lib/validator/parsers.ts` rather than inlining the check at the callsite.
- `withErrorHandler` automatically maps `CheckValidationError` and `TypeValidationError` to HTTP 400 — no manual try/catch required.

## Crypto / Security Rules
- **Never** use `bcrypt.hash` to look up records in the DB. bcrypt uses a random salt — the output differs every call.
- Always use `bcrypt.compare(plaintext, storedHash)` to verify bcrypt-hashed values.
- For token-based lookups, query by a non-hashed field (e.g. `userId` + `tokenType`), then verify the token with `bcrypt.compare`.
- Verification links must include the `userId` (`?token=...&id=...`) so the record can be fetched before comparison.
- Never store raw tokens in the database — always store the bcrypt hash.

## Database
- Migrations live in `migrations/` and are managed with `node-pg-migrate`.

- Run migrations: `bun db:migrate` - always ask for permission before running migrations
- Create a migration: `bun db:create <name>` - always create a new migration file for schema changes using this command, never alter existing ones or create them manually.
- Do not alter the DB schema outside of migration files.
- The migration files should be in raw sql using pgm.sql, not using the helper methods (e.g. pgm.createTable) — this ensures the SQL is explicit and clear.

## Frontend Rules
- Use shadcn/ui components and Radix primitives for all UI elements — do not create custom components unless necessary.
- Tailwind CSS for styling — no custom CSS files or inline styles.
- Follow the theme config in globals.css for colors, fonts, etc. Do not introduce new custom styles without adding them to the theme and do not use Arbitrary Value notation.
- Use Next.js App Router conventions for page and API route structure.
- Use zustand for state management if needed — avoid prop drilling but do not overuse global state.
- The app must be compatible with the latest versions of Chrome and Firefox — no experimental features that lack broad support.
- The app should be responsive and mobile-friendly, focus on mobile-first design.
- always use Next.js Image component for images, never raw `<img>` tags.
- alwasy use classnames (`cn`) for conditional classes, never template literals or manual string concatenation.


## Shared utilities
- **`src/lib/utils.ts`** is the single home for shared, stateless helper functions (e.g. `cn`, `relativeTime`).
- Before writing a new helper inside a component or page, check `src/lib/utils.ts` first.
- If a helper is useful beyond its immediate callsite, add it to `src/lib/utils.ts` — never define the same logic twice.

## Code Style
- Use `async/await` — no raw `.then()` chains.
- Prefer named exports. Default exports only for Next.js page/route conventions.
- Do not add comments unless the logic is non-obvious. including but not limited to jsx comments
- Do not add error handling for scenarios that cannot happen.
- TypeScript strict mode is on — no `any` unless absolutely necessary.

## PRD maintenance
- Product specs live in `/prds` (gitignored, local only). Each file maps one subject requirement.
- When building or modifying code that implements a PRD, you MUST update the relevant PRD in the same change — reflect new scope, data model, API, or acceptance-criteria deltas. The PRD is the canonical product spec; let it drift and it becomes lies.
- If work spans multiple PRDs, update each one touched.
- If a change has no matching PRD, create one in `/prds` before (or alongside) the code.

## Commands
| Task | Command |
|------|---------|
| Dev server | `bun run dev` |
| Lint | `bun run lint` |
| Lint fix | `bun run lint:fix` |
| Format | `bun run format` |
| Migrate DB | `bun db:migrate` |
| Unit tests | `bun x jest` |
| E2E tests | `bun run cy:open` |
