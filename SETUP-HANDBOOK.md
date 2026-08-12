# Platform Setup Handbook

Click-by-click account setup for every service Matcha depends on. This is the
"do it once" companion to `DEPLOYMENT.md`, which explains how the pipeline
works after everything exists.

Work through the sections **in order** — later steps need values produced by
earlier ones.

## Where you stand today

Detected from this working tree, 2026-08-12:

| Platform | Status | What you need to do |
|---|---|---|
| GitHub | ✅ repo exists — `Saturn-Lotus/matcha` | Add Actions secrets (§6) |
| Vercel | ✅ project exists — `matcha` under team `team_MEqg5EeJljuVSYQytaQ7YmsL` | Re-auth CLI, set env vars (§3) |
| Vercel Blob | ❓ unconfirmed | Create store if absent (§3b) |
| Neon | ⚠️ account exists, **database is gone** | Create a new project (§2) |
| Railway | ❌ no CLI, assume no account | Create account, deploy via CLI — the repo picker can't see `matcha` (§4) |
| Google Maps | ❓ no key in any env file | Create key (§5) |
| Gmail (mailer) | ✅ app password present in `.env.production` | Rotate it (§0) |

The Neon status is verified, not guessed: connecting to the endpoint in
`.env.production` returns `database "neondb" does not exist`. The endpoint host
still resolves, but the database was reclaimed.

---

## 0. Rotate the leaked-ish secrets first

`.env.production` is gitignored and was never committed (`git ls-files` shows
only `.env.example`), so nothing reached GitHub. But it holds live-looking
credentials in plaintext on disk, and the Neon password in it is now useless
anyway. Before wiring anything up, generate fresh values:

```sh
openssl rand -base64 32   # SESSION_SECRET
openssl rand -base64 32   # SALT
openssl rand -hex 32      # SOCKET_INTERNAL_SECRET
```

Also revoke the Gmail app password at
<https://myaccount.google.com/apppasswords> and issue a new one (§5b).

> `SESSION_SECRET` must end up **identical** on Vercel and Railway. The socket
> handshake in `socket-server/server.ts` verifies the session JWT the Next.js
> app issued — different secrets means every WebSocket connection is rejected
> as `unauthorized` while the app itself looks perfectly healthy.

---

## 1. GitHub — you already have this

Repo: `Saturn-Lotus/matcha`, remote `github.com-del-khay:Saturn-Lotus/matcha.git`
(an SSH host alias, so you have a per-account key set up).

Your `gh` CLI is signed out (`gh auth status` → `Active account: false`). To use
it for the secret setup in §6:

```
! gh auth login
```

(Type that with the leading `!` in Claude Code so the interactive prompt runs in
your terminal.) Otherwise do §6 through the web UI.

**Nothing to create here.** Come back at §6.

---

## 2. Neon — create a NEW project

Your old project is dead, so this is a from-scratch creation.

1. Sign in at <https://console.neon.tech> with the account you already have.
2. **New Project**:
   - Name: `matcha`
   - Postgres version: 17 (16 also fine)
   - Region: **AWS eu-central-1 (Frankfurt)** — matches your old endpoint and
     keeps latency low against a Frankfurt Vercel deploy.
3. On the project dashboard → **Connection string**, switch the toggle to
   **Pooled connection**. Copy it. It looks like:

   ```
   postgresql://neondb_owner:XXXX@ep-something-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

   Keep `sslmode=require`. Your old file said `sslmode=enable`, which is not a
   valid libpq value — don't carry that over.

   Use the **pooled** (`-pooler`) endpoint everywhere. `src/server/db/postgres.ts`
   opens a pool of up to 20 connections *per instance*, and you'll have Vercel
   functions plus the Railway container all connecting.

4. Open the **SQL Editor** and enable the extensions the migrations and seed
   need:

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

   PostGIS backs `user_locations` (migration `1762900000000`); `pgcrypto` and
   `uuid-ossp` back `scripts/seed_users.sql`.

5. Apply the schema from your machine (CI will do this on every later push):

   ```sh
   DATABASE_URL='postgresql://…?sslmode=require' bun run db:migrate
   ```

6. Seed 500 profiles for evaluation:

   ```sh
   DATABASE_URL='postgresql://…?sslmode=require' bun run db:seed
   ```

**Produces:** `DATABASE_URL` → needed in §3, §4, §6.

Free-tier note: Neon's free plan auto-suspends a branch after ~5 min idle. The
first request after a suspend pays a cold start of a second or two. Projects
left completely idle for weeks can be reclaimed — which is what happened to the
old one. Don't be surprised by it again.

---

## 3. Vercel — you already have this

Project `matcha` (`prj_KYalo3YPEumkse8QLDGK4axZPVJP`) under team
`team_MEqg5EeJljuVSYQytaQ7YmsL`. The repo is already linked via `.vercel/`.

Your CLI token is stale (`vercel whoami` → "The specified token is not valid").
Re-auth:

```
! vercel login
```

Then confirm the link still resolves:

```sh
vercel project ls
```

### 3a. Note your app domain

Dashboard → project `matcha` → Domains. Copy the production domain
(`https://matcha-….vercel.app` or your custom one). Call it **`APP_URL`**
below.

### 3b. Vercel Blob store

Dashboard → **Storage** → **Create Database** → **Blob** → name it `matcha` →
**Connect to Project** → select `matcha`, Production (and Preview if you want).

Connecting injects `BLOB_READ_WRITE_TOKEN` into the project automatically — do
not set it by hand.

Free-tier note: Hobby includes ~1 GB storage. Profile photos are capped at 5 MB
each by `assertImageSignature`, so 500 seeded profiles with real uploads can
approach that. The seed uses external avatar URLs, not Blob, so you're fine
until real users upload.

### 3c. Environment variables

Settings → Environment Variables → **Production**. Add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled string from §2 |
| `SESSION_SECRET` | from §0 |
| `SALT` | from §0 |
| `SALT_ALGORITHM` | `sha256` |
| `TOKEN_EXPIRY_HOURS` | `24` |
| `STORAGE_TYPE` | `vercel-blob` |
| `STORAGE_BUCKET_NAME` | `matcha` |
| `NEXT_PUBLIC_CLIENT_URL` | `APP_URL` |
| `NEXT_PUBLIC_API_URL` | `APP_URL` + `/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Railway URL — **fill after §4** |
| `SOCKET_INTERNAL_URL` | same Railway URL — **fill after §4** |
| `SOCKET_INTERNAL_SECRET` | from §0 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | from §5a |
| `APP_SERVICE` | `gmail` |
| `APP_EMAIL` | your sender address |
| `APP_PASSWORD` | app password from §5b |

`BLOB_READ_WRITE_TOKEN` is already there from §3b.

> Every `NEXT_PUBLIC_*` value is **baked into the client bundle at build time**.
> Changing one in the dashboard does nothing until you redeploy. This bites
> hardest with `NEXT_PUBLIC_SOCKET_URL` — set it before the build, or the
> browser will keep dialing `http://localhost:4001`.

**Produces:** `APP_URL` → needed in §4.

---

## 4. Railway — create a NEW account

> **You are a contributor on `Saturn-Lotus`, not an owner**, so Railway's repo
> picker will not list `matcha`. Railway can only see repos the **Railway
> GitHub App** has been granted, and installing an app on an organisation is an
> owner-level action you cannot perform.
>
> **Deploy without the GitHub connection instead.** `railway up` uploads the
> working directory straight to Railway's builder and authenticates with a
> project token — GitHub is never involved. Your `deploy-socket` CI job already
> works exactly this way, so you lose nothing: the only thing the GitHub
> integration adds is auto-deploy-on-push, which GitHub Actions is doing for
> you. Do **not** fork the repo to your personal account — that would split it
> from the CI that drives the Vercel half.
>
> If you'd rather have the native integration, the alternative is to ask a
> `Saturn-Lotus` owner to install the Railway GitHub App and grant it the
> `matcha` repo (GitHub → org Settings → Third-party Access / GitHub Apps).
> Everything below still applies; you'd just skip step 3's CLI deploy.

1. Sign up at <https://railway.com>. Signing in with GitHub is fine — it
   authenticates *you*, and does not require the org app installation.
2. Verify your account. Railway requires this before it will build anything.
3. Create the project and service **from the CLI**, not the repo picker:

   ```sh
   npm i -g @railway/cli
   railway login                     # opens a browser
   railway init --name matcha        # creates the project, links this directory
   railway add --service matcha-socket
   railway up --service matcha-socket
   ```

   In Claude Code, prefix the interactive ones with `!` so they run in your
   terminal: `! railway login`.

   `railway up` uploads this directory and Railway reads `railway.json` from
   the upload, so the Dockerfile config travels with the source — you don't
   need the dashboard's build settings. Confirm in the build log that it used
   **Dockerfile** `socket-server/Dockerfile`; if it fell back to Nixpacks it
   would try to build the whole Next.js app and fail.

4. The upload honours `.railwayignore` (committed at the repo root) so
   `node_modules`, `.next`, `.env*` and the PDFs stay out of the build context.
   Keep secrets in Railway variables (step 6), never in the uploaded files.

5. Service → **Settings → Networking → Generate Domain**. Copy it. Call it
   **`SOCKET_URL`** (`https://matcha-socket-….up.railway.app`).

   Railway terminates TLS at its edge, so browsers get `wss://` automatically.
   Leave `SOCKET_TLS_CERT` / `SOCKET_TLS_KEY` unset — that code path in
   `createSocketHttpServer()` is for bare-metal hosting only.

6. Service → **Variables**:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | same Neon pooled string as Vercel |
   | `SESSION_SECRET` | **byte-identical to Vercel** |
   | `SOCKET_INTERNAL_SECRET` | **byte-identical to Vercel** |
   | `SOCKET_CORS_ORIGIN` | `APP_URL` (comma-separated if you add more) |
   | `NEXT_PUBLIC_CLIENT_URL` | `APP_URL` |

   **Do not set `PORT`.** Railway injects it, and `socket-server/server.ts`
   reads `process.env.PORT` ahead of `SOCKET_PORT`.

7. Redeploy so the new variables take effect:

   ```sh
   railway up --service matcha-socket
   ```

   The service is healthy when `GET SOCKET_URL/health` returns
   `{"status":"ok"}` — Railway gates the rollout on that path per `railway.json`.

   > A green health check is **not** proof the variables landed.
   > `src/lib/auth/session.ts:12` reads `SESSION_SECRET` at module load and
   > encodes it without validating, so a missing secret boots a perfectly
   > healthy server that rejects every handshake as `unauthorized`. The step-3
   > deploy — which ran before you set any variables — will look fine and work
   > for nothing. Always finish with §8's browser check, not just `/health`.

8. **Go back to §3c** and fill `NEXT_PUBLIC_SOCKET_URL` and
   `SOCKET_INTERNAL_URL` with `SOCKET_URL`, then redeploy Vercel.

9. Settings → **Tokens** (project-scoped) → create one for CI. Call it
   **`RAILWAY_TOKEN`**. Note the **service name** too — you need both in §6.

Free-tier note: Railway's Trial gives a one-off credit, and the Hobby plan is
$5/month of usage. When credit runs out the service stops. That degrades
gracefully rather than breaking the app — `NotificationService.pushToSocket`
swallows the failed `fetch`, and the client falls back to the persisted
notification list — but live chat stops working, so watch the balance before a
demo.

**Produces:** `SOCKET_URL`, `RAILWAY_TOKEN`, service name → needed in §3c, §6.

---

## 5. Google + Gmail

### 5a. Maps API key (new)

Used by `src/app/settings/location-tab.tsx` for manual location picking.

1. <https://console.cloud.google.com> → create project `matcha`.
2. APIs & Services → **Enable APIs** → enable **Maps JavaScript API** (and
   **Geocoding API** if you want address lookup).
3. Credentials → **Create Credentials → API key**.
4. **Restrict it immediately** — this key ships in the client bundle and is
   public by definition:
   - Application restrictions → **HTTP referrers** → `APP_URL/*`
   - API restrictions → only the APIs you enabled above.
5. Billing must be enabled on the Cloud project; Maps has a monthly free
   allowance well above a school-project's usage.

**Produces:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

### 5b. Gmail app password (rotate existing)

`src/lib/mailer/Mailer.ts` uses nodemailer's `service` shorthand with plain
user/password, so it needs a Google **App Password**, not your account password.

1. The Google account must have 2-Step Verification on.
2. <https://myaccount.google.com/apppasswords> → revoke the old entry → create
   a new one named `matcha`.
3. Copy the 16-character value (strip the spaces).

**Produces:** `APP_EMAIL`, `APP_PASSWORD`, `APP_SERVICE=gmail`.

Gmail caps SMTP at ~500 messages/day. Matcha only sends verification and
password-reset mail, so that's ample — but it will not survive seeding 500
users *with* real email sends.

---

## 6. GitHub Actions secrets

`.github/workflows/ci.yml` gates `migrate-production`, `deploy-app` and
`deploy-socket` on the **`production`** environment.

Settings → Environments → **New environment** → `production`, then add these as
environment secrets:

| Secret | Value | From |
|---|---|---|
| `DATABASE_URL` | Neon pooled string | §2 |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens | §3 |
| `VERCEL_ORG_ID` | `team_MEqg5EeJljuVSYQytaQ7YmsL` | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `prj_KYalo3YPEumkse8QLDGK4axZPVJP` | `.vercel/project.json` |
| `RAILWAY_TOKEN` | **project**-scoped token (not a personal one) | §4.9 |
| `RAILWAY_SERVICE` | `matcha-socket` | §4.3 |

Or via CLI once `gh` is authed:

```sh
gh secret set DATABASE_URL      --env production --repo Saturn-Lotus/matcha
gh secret set VERCEL_TOKEN      --env production --repo Saturn-Lotus/matcha
gh secret set VERCEL_ORG_ID     --env production --repo Saturn-Lotus/matcha --body 'team_MEqg5EeJljuVSYQytaQ7YmsL'
gh secret set VERCEL_PROJECT_ID --env production --repo Saturn-Lotus/matcha --body 'prj_KYalo3YPEumkse8QLDGK4axZPVJP'
gh secret set RAILWAY_TOKEN     --env production --repo Saturn-Lotus/matcha
gh secret set RAILWAY_SERVICE   --env production --repo Saturn-Lotus/matcha
```

(Omitting `--body` prompts for the value instead of putting it in shell history.)

---

## 7. Which value goes where

The same secret often lives in three places. This is the authoritative matrix.

| Value | Vercel | Railway | GH Actions | Must match across |
|---|:--:|:--:|:--:|---|
| `DATABASE_URL` | ✅ | ✅ | ✅ | all three |
| `SESSION_SECRET` | ✅ | ✅ | — | **Vercel = Railway** |
| `SOCKET_INTERNAL_SECRET` | ✅ | ✅ | — | **Vercel = Railway** |
| `SALT`, `SALT_ALGORITHM` | ✅ | — | — | — |
| `STORAGE_TYPE`, `STORAGE_BUCKET_NAME` | ✅ | — | — | — |
| `BLOB_READ_WRITE_TOKEN` | auto | — | — | — |
| `NEXT_PUBLIC_CLIENT_URL` | ✅ | ✅ | — | both = `APP_URL` |
| `NEXT_PUBLIC_SOCKET_URL`, `SOCKET_INTERNAL_URL` | ✅ | — | — | = `SOCKET_URL` |
| `SOCKET_CORS_ORIGIN` | — | ✅ | — | = `APP_URL` |
| `PORT` | — | auto | — | never set by hand |
| `APP_EMAIL`/`APP_PASSWORD`/`APP_SERVICE` | ✅ | — | — | — |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ | — | — | — |
| `VERCEL_*`, `RAILWAY_*` | — | — | ✅ | — |

---

## 8. Verify the whole chain

Run these top to bottom. Each one isolates a different link, so the first
failure tells you which platform to look at.

```sh
# Neon reachable and migrated
psql "$DATABASE_URL" -c "select count(*) from pgmigrations"

# PostGIS present
psql "$DATABASE_URL" -c "select postgis_version()"

# Railway socket alive
curl -s https://<SOCKET_URL>/health          # → {"status":"ok"}

# Socket.IO handshake reachable from the internet
curl -s -o /dev/null -w '%{http_code}\n' \
  'https://<SOCKET_URL>/socket.io/?EIO=4&transport=polling'   # → 200

# Internal notify endpoint rejects an unsigned push
curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST https://<SOCKET_URL>/notify -d '{}'                 # → 403

# App up
curl -s -o /dev/null -w '%{http_code}\n' https://<APP_URL>/api   # → 200
```

Then in a browser, signed in on `APP_URL`:

- DevTools → Network → WS: a `wss://<SOCKET_URL>/socket.io/` connection that
  stays open. If it 400s on CORS, `SOCKET_CORS_ORIGIN` on Railway doesn't match
  `APP_URL` exactly (scheme and trailing slash both matter).
- If it connects then instantly drops with `unauthorized`, `SESSION_SECRET`
  differs between Vercel and Railway.
- Send a message in a chat from two browsers — that exercises the socket path.
- Trigger a like from one account — that exercises app → `POST /notify` →
  socket, i.e. `SOCKET_INTERNAL_URL` + `SOCKET_INTERNAL_SECRET`.

## 9. Known blockers before the first green pipeline

1. `bunx prettier --check "src/**/*.{ts,tsx,css}"` currently fails on
   `src/app/browse/components/discover-feed.tsx` and
   `src/lib/stores/notification-store.ts`. That fails the `check` job, which
   gates all three deploy jobs. Fix with `bun run format`.
2. `socket-server/Dockerfile` has not been built locally (no Docker daemon on
   this machine). The first Railway build is its first real exercise — watch
   that build log rather than assuming it passes.
