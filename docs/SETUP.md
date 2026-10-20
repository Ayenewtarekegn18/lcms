# Setup

How to run LKHC locally and how to build a new Supabase project for it. This replaces the old START_HERE / QUICK_START / LOCAL_SETUP / ENV_* guides.

> **Status:** prototype. Read [REMEDIATION_GUIDE.md](REMEDIATION_GUIDE.md) Phase 0 before you put real member data in any project.

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | **≥ 22.18** (22 LTS or 24) | Next.js 16; `node --env-file-if-exists` (db scripts) and built-in TypeScript loading (member import) |
| npm | 10+ | Lockfile is `package-lock.json` |
| A Supabase project | free tier is fine for development | Postgres, Auth, Storage |

Local Supabase works too: `npx supabase start` (Docker), then use the printed API URL and anon key in `.env.local` and `postgresql://postgres:postgres@127.0.0.1:54322/postgres` as `DATABASE_URL`.

## 2. Install and configure

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` from Supabase Dashboard → **Project Settings → API**:

| Variable | Required | Secret? | Used by |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | no | the app (browser and server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | **no**: it ships to every browser; RLS is what protects data | the app |
| `SUPABASE_SERVICE_ROLE_KEY` | only for the demo seed | **yes**: bypasses all security | `scripts/setup-demo-accounts.js` |
| `ALLOW_DEMO_SEED`, `DEMO_ADMIN_PASSWORD`, `DEMO_USER_PASSWORD` | only for the demo seed | yes | see [DEMO_SETUP.md](DEMO_SETUP.md) |
| `DATABASE_URL` | for `npm run db:*` | yes | your **local** database, for writing and testing migrations. Staging and production are migrated only by the Deploy workflow. The app never reads it |

Rules:
- `.env.local` goes in the project root.
- No quotes and no trailing slash on the URL.
- Restart `npm run dev` after any change.
- Never commit `.env.local` (it's git-ignored; only `.env.example` is tracked).
- Never prefix the service-role key with `NEXT_PUBLIC_`.

## 3. Build the database

The schema lives in [`db/migrations/`](../db/migrations/) as **dbmate** migrations (each file has an up and a down section). For development, point `.env.local` at a **local** database. Staging and production are changed only by the Deploy workflow (§7, [ENGINEERING.md](ENGINEERING.md)).

```bash
# local database (npx supabase start, or any Postgres in Docker with db/tests/supabase_shim.sql)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable
```

| Situation | Do |
|---|---|
| **Local database** | `npm run db:up`: builds all 66 tables, the security policies, audit triggers and integrity rules from zero. Then run [`db/tests/verify_security.sql`](../db/tests/verify_security.sql) against it ("all … checks passed"). |
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
| `npm run db:test` | Every migration up → down → up with an identical schema, then `verify_security.sql` | a **throwaway** Postgres with [`db/tests/supabase_shim.sql`](../db/tests/supabase_shim.sql) applied, `DATABASE_URL`, and `PSQL`/`PG_DUMP` if the client tools aren't on your PATH |
| `npm run test:e2e` | Playwright (`e2e/tests/`) against `npm run start` | the test stack below and a build made against it |

Throwaway database for `db:test` (Docker):
```bash
docker run -d --name lkhc-rt -p 127.0.0.1:55441:5432 -e POSTGRES_PASSWORD=postgres postgres:17.5
docker exec -i lkhc-rt psql -U postgres -q < db/tests/supabase_shim.sql
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:55441/postgres?sslmode=disable" \
  PSQL="docker exec -i lkhc-rt psql -U postgres" PG_DUMP="docker exec lkhc-rt pg_dump -U postgres" npm run db:test
docker rm -f lkhc-rt
```

End-to-end tests locally (the same steps CI runs; test-only keys, never real data):
```bash
export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable"
npm run e2e:stack -- db auth              # Postgres + GoTrue (Docker)
npm run db:up                              # migrations into the test database
npm run e2e:stack -- rest                  # PostgREST (after the migrations, so it sees the schema)
node e2e/stack/gateway.mjs &               # Supabase-style API on http://127.0.0.1:54321
export $(node e2e/stack/keys.mjs) NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
npm run e2e:seed                           # one user per role (e2e/users.ts)
npm run build && PW_CHANNEL=chrome npm run test:e2e   # PW_CHANNEL=chrome uses your installed Chrome
docker compose -f e2e/stack/docker-compose.yml down -v   # when done
```
The exported variables override `.env.local`, so this build points at the test stack. **Run `npm run build` again without them** before using `npm start` against your real project.

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
