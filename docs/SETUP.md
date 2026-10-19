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
npm run build      # must pass before merging (fails today; see Remediation 0.5)
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

Problems? See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
