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
| `DATABASE_URL` | for `npm run db:*` | yes | the database migrations are applied to (local/staging); the app never reads it |

Rules:
- `.env.local` goes in the project root.
- No quotes and no trailing slash on the URL.
- Restart `npm run dev` after any change.
- Never commit `.env.local` (it's git-ignored; only `.env.example` is tracked).
- Never prefix the service-role key with `NEXT_PUBLIC_`.

## 3. Build the database

The schema lives in [`db/migrations/`](../db/migrations/) as **dbmate** migrations (each file has an up and a down section). Add the database to `.env.local`:

```bash
# local (npx supabase start) or a staging/new Supabase project. Never production for day-to-day work.
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable
```

| Situation | Do |
|---|---|
| **New or local project** | `npm run db:up`: builds all 66 tables, the security policies, audit triggers and integrity rules from zero. Then run [`db/tests/verify_security.sql`](../db/tests/verify_security.sql) in the SQL editor ("Success" = every access check passed). |
| **Existing project built from the old scripts** (the live one) | Don't run the old scripts. Follow [REMEDIATION_GUIDE.md Phase 0](REMEDIATION_GUIDE.md#phase-0--contain-today), then [step 1.1](REMEDIATION_GUIDE.md#11-make-the-schema-reproducible): `db/scripts/adopt_existing_database.sql` once, then `npm run db:up`. |
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

1. Import the repo in Vercel.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` per environment: *Preview* points at a staging Supabase project, *Production* at the production project. Do **not** add the service-role key or any `POSTGRES_*` values; the app doesn't need them.
3. Redeploy after changing environment variables (`NEXT_PUBLIC_*` values are baked in at build time).
4. In the production Supabase project: sign-ups off, Site URL set to the production domain, no demo accounts, backups on (see [REMEDIATION_GUIDE.md 0.6](REMEDIATION_GUIDE.md#06-stop-the-project-from-silently-disappearing)).

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

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every pull request and on pushes to `main`:

| Job | Runs |
|---|---|
| Types, lint, unit tests, audit | `tsc`, `eslint`, `vitest`, `npm audit --omit=dev --audit-level=high` |
| Migrations | `npm run db:test` on a fresh Postgres 17 |
| End-to-end | the test stack, migrations, seed, `next build`, Playwright (report uploaded when it fails) |
| Migrate and deploy production | only on `main`, only after the three jobs above pass |

The deploy job does nothing until you configure it (it says so in the run log). To turn it on:
1. **Settings → Environments → New environment** `production`. Add yourself as a required reviewer, so every release waits for your approval.
2. Adopt the production database once ([REMEDIATION_GUIDE 1.1](REMEDIATION_GUIDE.md#11-make-the-schema-reproducible)). The job refuses to migrate a database that hasn't been adopted.
3. Environment secrets:

| Secret | Value |
|---|---|
| `PRODUCTION_DATABASE_URL` | Supabase → Connect → **Session pooler** URI (port 5432), with `?sslmode=require` |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `.vercel/project.json` after `npx vercel link`, or the project's Settings page |

4. Stop Vercel's Git integration deploying `main` by itself, so production is deployed only after the migrations ran: add `{"git": {"deploymentEnabled": {"main": false}}}` to `vercel.json` in the same PR that adds the secrets. Preview deployments for pull requests stay on.
5. **Settings → Branches → Add rule** for `main`: require a pull request, one approval, and the three CI checks.

Migrations run before the new code is deployed, so a migration must keep the previous release working (add columns and tables first; drop or rename only in a later release).

[Dependabot](../.github/dependabot.yml) opens weekly update PRs for npm packages and GitHub Actions; it waits 14 days after each release before proposing it. The `overrides` in `package.json` hold back three packages of the test tooling (`rolldown`, `tinybench`, and `postcss` inside `vite`) that were only days old when it was added; when a Dependabot PR for `vite` or `vitest` conflicts with them, delete the overrides in that PR.

## 8. Keep-warm ping

Free Supabase projects are paused after about a week without activity, and the first request after a quiet spell is slow. [`.github/workflows/keepalive.yml`](../.github/workflows/keepalive.yml) sends one tiny request every 10 minutes: `public.keepalive()` (migration `20261019000007`; returns the time, reads no data) and, if configured, the app's `/api/keepalive`.

1. Apply the migrations to the project (`npm run db:up`, or the deploy job). Until then the ping fails with 404.
2. Repository **Settings → Secrets and variables → Actions**:
   - secrets `SUPABASE_URL` (`https://<project-ref>.supabase.co`) and `SUPABASE_ANON_KEY` (the public anon key);
   - variable `APP_URL`, the deployed site (for example `https://lkhc.vercel.app`), to warm the Vercel function too.
3. Actions → **Keep Supabase warm** → *Run workflow* once and check both lines say `HTTP 200`.

Scheduled workflows run only from `main`, can start several minutes late, and GitHub switches them off after 60 days without commits (it emails you; re-enable from the Actions tab). For a second, independent pinger, create a free monitor at UptimeRobot or cron-job.org for `<APP_URL>/api/keepalive` every 5–10 minutes: it keeps both warm and alerts you when the site or the database is down (the endpoint returns 503 when it can't reach the database).

Problems? See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
