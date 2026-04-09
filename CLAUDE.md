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

### Repositories
- All repositories extend `BaseRepositoryClass<T>` from `src/server/repositories/base.ts`.
- Repositories handle only DB queries — no business logic.
- Use `query(whereClause, params)` for filtered lookups.

### Services
- All business logic lives in service classes (e.g. `AuthService`).
- Services receive repositories and dependencies via constructor injection.
- Never instantiate services or repos directly in routes — use factories from `src/server/factories`.

### API Routes
- All routes wrap handlers with `withErrorHandler` from `src/middlewares/routes-middlewares/withErrorHandler.ts`.
- Domain errors are mapped to HTTP status codes via the `@HTTPError(statusCode)` decorator — add new error classes this way.
- Do not import unused identifiers in route files (e.g. `httpExceptionMapper` if not called).

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
