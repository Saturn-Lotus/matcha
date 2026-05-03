# PRD 01 — Registration & Signing-in

## Context
Subject §IV.1. Entry point for every user. Also covers email verification, login, logout, and password reset.

---

## Scope
- **Registration**: email, username, first name, last name, password. Reject dictionary/common passwords.
- **Email verification**: one-time signed link emailed to the user; account cannot be used until verified.
- **Login**: username + password.
- **Logout**: single click from any page.
- **Password reset**: user requests reset email, follows a one-time link, sets a new password.

## Out of scope
- OAuth/OmniAuth (bonus, see PRD 08).
- Multi-factor auth.

---

## Data model
- `users` — id, email (unique), username (unique), first_name, last_name, password_hash, email_verified_at, created_at, updated_at.
- `user_tokens` — id, user_id, token_hash (bcrypt), token_type (`email_verification` | `password_reset`), expires_at, consumed_at.

---

## API surface
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/register` | Create unverified user, issue verification token, send email |
| `GET`  | `/api/auth/verify-email?token=…&id=…` | Consume token, set `email_verified_at` |
| `POST` | `/api/auth/login` | Returns JWT session cookie |
| `POST` | `/api/auth/logout` | Clears session cookie |
| `POST` | `/api/auth/forgot-password` | Issue reset token, send email |
| `POST` | `/api/auth/reset-password` | Consume token, update password |

All routes: thin, `withErrorHandler`, call one `AuthService` method. Services own bcrypt + token issuance. Repositories own SQL.

---

## UI
- `/register`, `/login`, `/forgot-password`, `/reset-password?token=…&id=…`, `/verify-email?token=…&id=…`.
- shadcn `Form`, `Input`, `Button`. Inline validation; server errors surfaced via toast.
- Logout button in the global header (authenticated layout).

---

## Password policy
- Reject via `zxcvbn` (already integrated) score < 3. Min length 8.
- Client-side strength meter; server-side authoritative check.

---

## Security
- Passwords stored only as bcrypt hash (cost ≥ 10).
- Tokens: 32 random bytes (hex), store **bcrypt hash** in `user_tokens`, compare with `bcrypt.compare`. Link carries `?token=…&id=…`.
- Tokens single-use (`consumed_at`) with expiry (1h verification, 30m reset).
- Rate-limit register / forgot-password endpoints.
- Generic error messages on login (never reveal which field is wrong).

---

## User Stories

| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| AU-1 | new visitor | to register with email, username, and a password | I can create my account |
| AU-2 | registered user | to receive a verification email after signing up | I can prove I own the address |
| AU-3 | registered user | the verification link to expire and work only once | my account is safe from token replay |
| AU-4 | verified user | to log in with my username and password | I can access my account |
| AU-5 | logged-in user | to log out from any page with one click | I can end my session securely |
| AU-6 | user who forgot their password | to request a reset email | I can regain access without support |
| AU-7 | user resetting password | the reset link to expire and work only once | someone who intercepts old emails cannot use them |
| AU-8 | any user | to see a helpful error on bad login without knowing which field is wrong | my account is not enumerable |
| AU-9 | any user | weak dictionary passwords to be rejected at registration | I'm protected from obvious credentials |

---

## Tasks

### Migration
- [ ] Create migration `create-users-table` with `pgm.sql` — columns: id (uuid PK), email, username, first_name, last_name, password_hash, email_verified_at, created_at, updated_at
- [ ] Create migration `create-user-tokens-table` — columns: id, user_id (FK → users), token_hash, token_type (enum), expires_at, consumed_at
- [ ] Add unique indexes: `users(email)`, `users(username)`
- [ ] Add index `user_tokens(user_id, token_type)` for lookup before bcrypt compare

### Repository — `UserRepository`
- [ ] `create(data)` — insert user row
- [ ] `findByEmail(email)` — lookup for login
- [ ] `findByUsername(username)` — lookup for login
- [ ] `findById(id)` — general lookup
- [ ] `setEmailVerified(userId)` — set `email_verified_at = NOW()`
- [ ] `updatePassword(userId, hash)` — update `password_hash`
- [ ] `updateEmail(userId, email)` — update email, clear `email_verified_at`

### Repository — `TokenRepository`
- [ ] `create(userId, type, hash, expiresAt)` — insert token row
- [ ] `findActive(userId, type)` — fetch unconsumed, unexpired token by userId + type
- [ ] `consume(tokenId)` — set `consumed_at = NOW()`

### Service — `AuthService`
- [ ] `register(dto)` — validate fields, zxcvbn check, hash password, create user, issue verification token, send email
- [ ] `verifyEmail(userId, rawToken)` — fetch token, bcrypt.compare, consume, set email_verified_at
- [ ] `login(dto)` — find user by username, bcrypt.compare, check email_verified_at, return session payload
- [ ] `logout()` — no-op at service level (cookie cleared in route)
- [ ] `forgotPassword(email)` — find user, issue reset token, send email (silent if not found)
- [ ] `resetPassword(userId, rawToken, newPassword)` — verify token, zxcvbn check, hash, updatePassword, consume token
- [ ] Define domain errors: `UserAlreadyExists`, `InvalidCredentials`, `EmailNotVerified`, `TokenExpired`, `TokenAlreadyUsed`, `WeakPassword`

### Routes
- [ ] `POST /api/auth/register` — parse body, call `AuthService.register`, return 201
- [ ] `GET  /api/auth/verify-email` — parse query params, call `AuthService.verifyEmail`, return 200 or redirect
- [ ] `POST /api/auth/login` — call service, set `session` cookie, return 200
- [ ] `POST /api/auth/logout` — clear `session` cookie, return 200
- [ ] `POST /api/auth/forgot-password` — call service, always return 200 (no enumeration)
- [ ] `POST /api/auth/reset-password` — call service, return 200

### UI
- [ ] `/register` page — form with all fields, password strength meter (zxcvbn), submit calls `/api/auth/register`
- [ ] Email-verification pending page shown after register; "resend" button
- [ ] `/verify-email` page — auto-calls API on mount, shows success or error
- [ ] `/login` page — username + password, forgot-password link
- [ ] `/forgot-password` page — email field, success state regardless of email existence
- [ ] `/reset-password` page — reads `?token=&id=` from URL, new password + confirm
- [ ] Logout button in `<Header>` calling `POST /api/auth/logout` + redirect to `/login`

### Validation schemas (`src/server/schemas/`)
- [ ] `registerSchema` — email format, username alphanumeric 3–30, names 1–50, password min 8
- [ ] `loginSchema` — username + password required
- [ ] `resetPasswordSchema` — password + confirmPassword match, min 8

### Tests
- [ ] Unit: `AuthService.register` — happy path, duplicate email, duplicate username, weak password
- [ ] Unit: `AuthService.verifyEmail` — valid token, expired token, already consumed
- [ ] Unit: `AuthService.login` — valid, wrong password, unverified email
- [ ] Unit: `AuthService.resetPassword` — valid, expired, replayed
- [ ] E2E (Cypress): full register → verify email (mock mailer) → login → logout flow

---

## Acceptance criteria
- User cannot log in before verifying email.
- Verification and reset links work once and then fail with 410/400.
- Password reset invalidates prior session tokens optionally (nice-to-have).
- Logout clears cookie and any protected route responds 401 afterwards.
- Unit tests for `AuthService` cover happy path + each domain error.

---

## Open questions
- Session TTL and refresh policy — currently inherited from existing `jose` implementation; confirm during build.
