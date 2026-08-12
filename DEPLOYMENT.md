# Deployment

Matcha is split across three providers because Vercel's serverless runtime
cannot host a long-lived WebSocket process or a Postgres instance.

> Setting the accounts up for the first time? Start with
> **[`SETUP-HANDBOOK.md`](./SETUP-HANDBOOK.md)** — it walks each platform
> click-by-click. This file describes how the pipeline works once they exist.

| Piece | Provider | Notes |
|---|---|---|
| Next.js app (`src/`) | Vercel | Built and deployed by CI (`deploy-app`) |
| Image storage | Vercel Blob | `STORAGE_TYPE=vercel-blob` |
| PostgreSQL + PostGIS | Neon | Migrations applied by CI (`migrate-production`) |
| Socket.IO server (`socket-server/`) | Railway | Docker image, deployed by CI (`deploy-socket`) |

The app talks to the socket server over plain HTTPS (`POST /notify`, guarded by
`SOCKET_INTERNAL_SECRET`), so no private networking between providers is needed.

---

## 1. Neon (database)

1. Create a project at <https://console.neon.tech> — region `eu-central-1`
   keeps latency low against a Vercel `fra1` deployment.
2. Copy the **pooled** connection string from the dashboard. It looks like:

   ```
   postgresql://<user>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/<db>?sslmode=require
   ```

3. Enable PostGIS once, from the Neon SQL editor (the
   `1762900000000_user-locations-postgis` migration also issues
   `CREATE EXTENSION IF NOT EXISTS postgis`, but the role needs the privilege):

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

   `pgcrypto` and `uuid-ossp` are required by `scripts/seed_users.sql`.

4. Apply migrations. CI does this on every push to `main`, but for the first
   run do it locally:

   ```sh
   DATABASE_URL='postgresql://…?sslmode=require' bun run db:migrate
   ```

5. Seed (optional, needed for evaluation):

   ```sh
   DATABASE_URL='postgresql://…?sslmode=require' bun run db:seed
   ```

> Use the **pooled** endpoint (`-pooler`) for the app and the socket server —
> `src/server/db/postgres.ts` opens a pool of up to 20 connections per instance
> and Neon's direct endpoint caps out well below that across serverless
> invocations.

---

## 2. Vercel (app + Blob)

The project is already linked (`.vercel/project.json` → project `matcha`).

1. Create a Blob store: Vercel dashboard → Storage → Blob → connect it to the
   `matcha` project. This injects `BLOB_READ_WRITE_TOKEN` automatically.
2. Set the Production environment variables (Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `SESSION_SECRET` | 32-byte base64 — `openssl rand -base64 32` |
   | `SALT` | 32-byte base64 |
   | `SALT_ALGORITHM` | `sha256` |
   | `TOKEN_EXPIRY_HOURS` | `24` |
   | `STORAGE_TYPE` | `vercel-blob` |
   | `STORAGE_BUCKET_NAME` | `matcha` |
   | `NEXT_PUBLIC_CLIENT_URL` | `https://<app>.vercel.app` |
   | `NEXT_PUBLIC_API_URL` | `https://<app>.vercel.app/api` |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://<socket>.up.railway.app` |
   | `SOCKET_INTERNAL_URL` | `https://<socket>.up.railway.app` |
   | `SOCKET_INTERNAL_SECRET` | shared secret — `openssl rand -hex 32` |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JS API key |
   | `APP_SERVICE` / `APP_EMAIL` / `APP_PASSWORD` | mailer credentials |

   `NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so
   changing one requires a redeploy — setting it at runtime has no effect.

3. `next.config.ts` already allows `*.public.blob.vercel-storage.com` in
   `images.remotePatterns` when `STORAGE_TYPE=vercel-blob`; no code change needed.

---

## 3. Railway (socket server)

Railway builds `socket-server/Dockerfile` (declared in `railway.json` at the
repo root) — a plain Node image that runs `tsx socket-server/index.ts`. There is
no `next build` in that image.

The service is **not** connected to GitHub — the repo lives under the
`Saturn-Lotus` org where we lack the rights to install Railway's GitHub App.
Deploys go through `railway up`, which uploads the source directly (honouring
`.railwayignore`) and authenticates with a project token. CI's `deploy-socket`
job does exactly this, so nothing is lost but the redundant auto-deploy hook.

1. `npm i -g @railway/cli && railway login`
2. `railway init --name matcha`, then `railway add --service matcha-socket`
   and `railway up --service matcha-socket`.
3. Generate a public domain: service → Settings → Networking → Generate Domain.
   Railway terminates TLS, so the browser gets `wss://` for free — leave
   `SOCKET_TLS_CERT` / `SOCKET_TLS_KEY` unset.
4. Set service variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | same Neon pooled string |
   | `SESSION_SECRET` | **must match Vercel** — the socket handshake verifies the app's session JWT |
   | `SOCKET_INTERNAL_SECRET` | **must match Vercel** |
   | `SOCKET_CORS_ORIGIN` | `https://<app>.vercel.app` (comma-separated for several) |
   | `NEXT_PUBLIC_CLIENT_URL` | `https://<app>.vercel.app` |

   Do **not** set `PORT` — Railway injects it, and `socket-server/server.ts`
   prefers it over `SOCKET_PORT`.

5. Health check is `GET /health` (configured in `railway.json`). Railway holds
   the new deployment until it returns 200.

> Free-tier note: Railway's Trial plan sleeps/stops services once the monthly
> credit is exhausted. If the socket server is down, chat and live notifications
> degrade but the app keeps working — `NotificationService.pushToSocket`
> swallows the failed `fetch`, and the client falls back to the persisted
> notification list on reconnect.

---

## 4. GitHub Actions secrets

`.github/workflows/ci.yml` gates the deploy jobs on the `production`
environment. Add these under Settings → Environments → `production` (or repo
secrets):

| Secret | Where to get it |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |
| `RAILWAY_TOKEN` | Railway → project → Settings → Tokens (**project** token) |
| `RAILWAY_SERVICE` | the socket service's name or id |

## Pipeline shape

```
push → check ─┐
              ├→ migrate-production ─┬→ deploy-app     (Vercel)
   test-and-build ─┘   (main only)   └→ deploy-socket  (Railway)
```

Migrations run once, before either runtime is replaced, so the app and the
socket server never observe a half-migrated schema. Both deploys are skipped on
non-`main` branches because `migrate-production` is skipped.
