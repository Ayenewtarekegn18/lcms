# Setup

How to run LKHC locally and how to build a new Supabase project for it. This replaces the old START_HERE / QUICK_START / LOCAL_SETUP / ENV_* guides.

> **Status:** prototype. Read [REMEDIATION_GUIDE.md](REMEDIATION_GUIDE.md) Phase 0 before you put real member data in any project.

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | **≥ 22.18** (22 LTS or 24) | Next.js 16; `node --env-file-if-exists` (db scripts) and built-in TypeScript loading (scripts) |
| npm | 10+ | The lockfile is `package-lock.json` |
| Docker Desktop | running, with **4 GB or more** memory | Your local Supabase (`npm run local:start`) |

You don't need a Supabase account to develop. Staging and production are set up once (§7), and the pipeline changes them.

## 2. Install and start

```bash
npm install
npm run local:start    # the first run downloads the Supabase images (a few minutes)
npm run dev            # http://localhost:3000
```

`local:start` gives you your own Supabase in Docker, with:
- **Postgres 17** with every migration from `db/migrations` applied;
- **Auth** (sign-ups off, as on staging);
- **Storage**;
- **Studio**: a database UI, at http://127.0.0.1:54323;
- **Mailpit**: catches invitation and password-reset emails, at http://127.0.0.1:54324.

It also creates one login per role (password `Local-Test-Password-1`) and some sample data: ministries, events, transactions and registered members. It writes `.env.development.local`, which `npm run dev` reads ahead of `.env.local`, so the app talks to your local stack.

| Login | Role |
|---|---|
| `admin@lkhc.test` | admin |
| `elder@lkhc.test` | elder |
| `leader@lkhc.test` | ministry_leader |
| `finance@lkhc.test` | finance |
| `member@lkhc.test` | member |

| Command | Does |
|---|---|
| `npm run local:start` | Starts the stack, or reuses it if it's already running. Applies new migrations, tops up the test data, and prints the addresses |
| `npm run local:reset` | Wipes the local database and rebuilds it (migrations, then test data) |
| `npm run local:stop` | Stops the stack and removes `.env.development.local` |
| `npm run local:status` | Addresses and logins |

### `.env.local` (optional)

You only need `.env.local` to run the app against **staging** instead (stop the local stack first) or to import lebu-form records. Copy `.env.example` and fill in values from Supabase → **Project Settings → API**:

| Variable | Secret? | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | no | the app (browser and server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **no**: it ships to every browser; RLS is what protects data | the app |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes**: bypasses all security | scripts only (`import:lebu-form`, demo seed) |
| `DATABASE_URL` | yes | `npm run db:*` against a database **other than** the local stack. Never staging or production; the Deploy workflow migrates those |

Rules:
- No quotes, and no trailing slash on the URL.
- Restart `npm run dev` after any change.
- Never commit env files; only `.env.example` is tracked.
- Never prefix the service-role key with `NEXT_PUBLIC_`.

## 3. Build the database

The schema lives in [`db/migrations/`](../db/migrations/) as **dbmate** migrations (each file has an up and a down section). `npm run local:start` applies them to your local stack, and the `db:*` commands use the local stack while it's running. Staging and production are changed only by the Deploy workflow (§7, [ENGINEERING.md](ENGINEERING.md)).

| Situation | Do |
|---|---|
| **Local database** | `npm run local:start` (or `npm run db:up` after adding a migration) builds all the tables, security policies, audit triggers and integrity rules from zero. `npm run local:reset` starts over. |
| **Staging or production** | Never by hand. The Deploy workflow applies the migrations after CI passes (§7). A new, empty project is built from zero by its first deploy. |
| **A project built from the old scripts** | Don't run the old scripts. Adopt it once: [REMEDIATION_GUIDE.md Phase 0](REMEDIATION_GUIDE.md#phase-0--contain-today), then [step 1.1](REMEDIATION_GUIDE.md#11-make-the-schema-reproducible). (Staging was adopted on 2026-10-20.) |
| **Roll back the last migration** | `npm run db:down` (security migrations refuse unless explicitly unlocked; see step 1.1). |
| **See what's applied** | `npm run db:status` |
| **Change the schema** | `npm run db:new <name>`, write both sections, then `db:up` → `db:down` → `db:up` locally; CI's round-trip test checks the down is exact. |

The old `scripts/*.sql` files are archived in `scripts/legacy/` and must not be run. Use [DEMO_SETUP.md](DEMO_SETUP.md) for demo data.

Then, in the dashboard:
- **Authentication → Sign In / Providers:** Email enabled. Turn **off** "Allow new users to sign up" for any project with real data (invite users instead).
- **Authentication → URL Configuration:** Site URL `http://localhost:3000` (development) or the deployed URL; add both to Redirect URLs.

## 4. Run

```bash
npm run dev        # http://localhost:3000
npm run lint
npm run build      # must pass before merging (CI checks it)
npm start          # serve the production build
```

Create your first admin: invite yourself (Auth → Users → Invite), sign in once, then in the SQL editor:
```sql
UPDATE public.profiles SET role = 'admin'
 WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');
```
Sign out and back in. Roles are explained in [ROLES_AND_ACCESS.md](ROLES_AND_ACCESS.md).

## 5. Deploy (Vercel)

Deploys are done by the pipeline, not by hand: §7 covers the one-time Vercel setup. Points to keep in mind:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set per Vercel environment: **Preview** → staging, **Production** → production. Don't add the service-role key or any `POSTGRES_*` values; the app doesn't need them.
- `NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them (Actions → Deploy → Run workflow).
- In every Supabase project that's reachable online: sign-ups off, Site URL set, no demo accounts. Production also needs backups on ([REMEDIATION_GUIDE.md 0.6](REMEDIATION_GUIDE.md#06-stop-the-project-from-silently-disappearing)).

## 6. Testing

| Command | What | Needs |
|---|---|---|
| `npm test` | Unit tests (Vitest, `tests/unit/`) | nothing |
| `npm run test:e2e` | Playwright (`e2e/tests/`) against a production build of the app | the local stack (`npm run local:start`). The tests refuse to run against any other Supabase |
| `npm run db:test` | Every migration up → down → up with an identical schema, then `verify_security.sql` | a **throwaway** Postgres (below). It rolls migrations back, so never point it at a database you care about |

End-to-end tests locally, the same way CI runs them:
```bash
npm run local:start
PW_CHANNEL=chrome npm run test:e2e   # builds the app against the local stack, then runs the tests; PW_CHANNEL=chrome uses your Chrome
```
The tests build and start their own copy of the app on port 3100, so an app you're running yourself on :3000 is never used. They log in as the test accounts above and create data; `npm run local:reset` cleans it up.

Throwaway database for `db:test` (Docker):
```bash
docker run -d --name lkhc-rt -p 127.0.0.1:55441:5432 -e POSTGRES_PASSWORD=postgres postgres:17.5
docker exec -i lkhc-rt psql -U postgres -q < db/tests/supabase_shim.sql
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:55441/postgres?sslmode=disable" \
  PSQL="docker exec -i lkhc-rt psql -U postgres" PG_DUMP="docker exec lkhc-rt pg_dump -U postgres" npm run db:test
docker rm -f lkhc-rt
```

## 7. CI/CD

How environments, releases and database changes fit together is in [ENGINEERING.md](ENGINEERING.md). The workflows:

| Workflow | When it runs | What it does |
|---|---|---|
| [CI](../.github/workflows/ci.yml) | Every PR, every push to `main`, every published release | Types, lint, unit tests and audit; the migration round trip and RLS checks; end-to-end tests |
| [Deploy](../.github/workflows/deploy.yml) | After CI passes: on `main` → **staging**; on a release → **production**, after your approval. Also by hand (Run workflow) to redeploy or roll back | Checks the database is under dbmate, applies pending migrations, runs the RLS checks (staging only), then builds and deploys the app to Vercel |
| [Keep Supabase warm](../.github/workflows/keepalive.yml) | Every 10 minutes | See §8 |
| [Dependabot](../.github/dependabot.yml) | Weekly | Update PRs |

Each part of Deploy is skipped, with a notice in the run, until its settings exist. Set them up once.

### Staging database

The current Supabase project is staging.
1. GitHub → **Settings → Environments → New environment** `staging`.
2. **Add environment secret** `DATABASE_URL`: the session-pooler connection string (Supabase → Connect → Session pooler, with your database password and `?sslmode=require`). It's the same value you have in `.env.local` today. After this, remove that line from `.env.local` or point it at a local database. Staging is now changed only by the pipeline.
3. **Actions → Deploy → Run workflow**, environment `staging`, ref `main`. The run should show `Pending: 0` and `verify_security: all 24 checks passed`.

### App hosting (Vercel)

1. In Supabase, turn off **"Allow new users to sign up"** (Authentication → Sign In / Providers) **before** the app is reachable online.
2. [vercel.com](https://vercel.com) → **Continue with GitHub** → **Add New… → Project** → import `lcms`. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the staging values from `.env.local`.
   - The Git connection gives every pull request its own preview site.
   - `vercel.json` stops Vercel deploying `main` by itself; the pipeline does that after migrating. The deployment Vercel makes when you first import can be ignored.
3. Vercel → **Account Settings → Tokens** → create a token for GitHub Actions. In GitHub → **Settings → Secrets and variables → Actions**:
   - secret `VERCEL_TOKEN`;
   - variables `VERCEL_ORG_ID` (Vercel → Settings → General → Team ID) and `VERCEL_PROJECT_ID` (project → Settings → General → Project ID).
4. Run **Deploy** for `staging` again. The run summary and the `staging` environment now link to the app.

Preview sites, staging included, are visible only to people signed in to your Vercel account (Vercel's default deployment protection).

### Production (at go-live)

1. Create a **new** Supabase project on a paid plan, for daily backups and no pausing. Turn off sign-ups, and set the Site URL to the production domain.
2. GitHub environment `production`: secret `DATABASE_URL` (its session pooler), and **Required reviewers**: you.
3. Vercel → project → **Settings → Environment Variables**: give **Production** the new project's URL and anon key.
4. Publish a GitHub release `v1.0.0` (Releases → Draft a new release → new tag). CI runs on the tag, then Deploy waits for your approval. It builds the whole schema on the empty database and deploys the app.
5. Create the first admin: invite yourself (Authentication → Users → Invite), sign in once, then run the `UPDATE public.profiles SET role = 'admin' …` from §4 in the SQL editor. This is the only SQL anyone runs by hand, once per new project.

### Branch protection

Until the ruleset file arrives (ENGINEERING.md step 3): GitHub → **Settings → Rules → Rulesets → New branch ruleset** for `main`:
- require a pull request (0 approvals while you work alone);
- require the three CI checks: **Types, lint, unit tests, audit**, **Migrations (up/down round trip) and RLS checks** and **End-to-end (Playwright)**;
- block force pushes and deletion.

### Dependabot and overrides

Dependabot waits 14 days after each release before proposing it. The `overrides` in `package.json` hold back three packages of the test tooling (`rolldown`, `tinybench`, and `postcss` inside `vite`) that were only days old when it was added. When a Dependabot PR for `vite` or `vitest` conflicts with them, delete the overrides in that PR.

## 8. Keep-warm ping

Free Supabase projects are paused after about a week without activity, and the first request after a quiet spell is slow. [`.github/workflows/keepalive.yml`](../.github/workflows/keepalive.yml) sends one tiny request every 10 minutes: `public.keepalive()` (migration `20261019000007`; returns the time, reads no data) and, if configured, the app's `/api/keepalive`.

1. Apply the migrations to the project (`npm run db:up`, or the deploy job). Until then the ping fails with 404.
2. Repository **Settings → Secrets and variables → Actions**:
   - secrets `SUPABASE_URL` (`https://<project-ref>.supabase.co`) and `SUPABASE_ANON_KEY` (the public anon key);
   - variable `APP_URL`, the deployed site (for example `https://lkhc.vercel.app`), to warm the Vercel function too.
3. Actions → **Keep Supabase warm** → *Run workflow* once and check both lines say `HTTP 200`.

Scheduled workflows run only from `main`, can start several minutes late, and GitHub switches them off after 60 days without commits (it emails you; re-enable from the Actions tab). For a second, independent pinger, create a free monitor at UptimeRobot or cron-job.org for `<APP_URL>/api/keepalive` every 5–10 minutes: it keeps both warm and alerts you when the site or the database is down (the endpoint returns 503 when it can't reach the database).

Problems? See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
