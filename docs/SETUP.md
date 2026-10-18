# Setup

How to run LKHC locally and how to build a new Supabase project for it. This replaces the old START_HERE / QUICK_START / LOCAL_SETUP / ENV_* guides.

> **Status:** prototype. Read [REMEDIATION_GUIDE.md](REMEDIATION_GUIDE.md) Phase 0 before you put real member data in any project.

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | **≥ 20.9** (22 LTS recommended) | Next.js 16 requirement |
| npm | 10+ | Lockfile is `package-lock.json` |
| A Supabase project | free tier is fine for development | Postgres, Auth, Storage |

Local Supabase (`npx supabase start`) becomes the recommended setup after [Remediation Step 1.1](REMEDIATION_GUIDE.md#11-make-the-schema-reproducible). Until then the browser client only accepts `https://*.supabase.co` URLs.

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
| `POSTGRES_URL` | optional | yes | your own `psql` / CLI use; the app never reads it |

Rules:
- `.env.local` goes in the project root.
- No quotes and no trailing slash on the URL.
- Restart `npm run dev` after any change.
- Never commit `.env.local` (it's git-ignored; only `.env.example` is tracked).
- Never prefix the service-role key with `NEXT_PUBLIC_`.

## 3. Build the database (new project)

Paste each file into Supabase Dashboard → **SQL Editor** → *Run*, **in this order**. The order was tested end to end on a fresh database: 66 tables, all security checks pass.

| # | File | Notes |
|---|---|---|
| 1 | `scripts/001_create_church_schema.sql` | core tables |
| 2 | `scripts/002_profile_trigger.sql` | sign-up trigger (replaced safely by remediation 01) |
| 3 | `scripts/003_phase2_ministry_modules.sql` | |
| 4 | `scripts/004_analytics_and_localization.sql` | |
| 5 | `scripts/008_simplify_rls_policies.sql` | supersedes 007; policies are replaced by remediation 02 |
| 6 | `scripts/011_announcements_and_templates.sql` | |
| 7 | `scripts/012_documents.sql` | |
| 8 | `scripts/013_events_event_date_columns.sql` | |
| 9 | `scripts/014_roles_and_audit.sql` | |
| 10 | `scripts/015_ministry_modules_prd.sql` | 34 ministry tables |
| 11 | `scripts/016_fix_rls_profiles_audit.sql` | |
| 12 | `scripts/016a_profiles_admin_insert_only.sql` | |
| 13 | `docs/remediation/sql/01_emergency_lockdown.sql` | **security: required** |
| 14 | `docs/remediation/sql/02_rls_rewrite.sql` | **security: required**; also creates the private `documents` storage bucket |
| 15 | `docs/remediation/sql/03_audit_log.sql` | audit triggers |
| 16 | `docs/remediation/sql/04_schema_hardening.sql` | integrity |
| 17 | `docs/remediation/sql/05_app_alignment.sql` | schema the app code expects |
| ✓ | `docs/remediation/sql/verify_security.sql` | "Success" = all access checks pass |

**Never run** `005`, `006`, `007`, `009` or `010` on a new project. They are demo-only or historical, and four of them fail on a fresh database. Use [DEMO_SETUP.md](DEMO_SETUP.md) for demo data.

> Existing project instead of a new one? Don't follow this table. Follow [REMEDIATION_GUIDE.md Phase 0](REMEDIATION_GUIDE.md#phase-0--contain-today) and start with `inspect_schema.sql`.

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
