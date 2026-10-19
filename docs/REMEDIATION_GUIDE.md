# Remediation Guide

A step-by-step plan to take LKHC from prototype to production. Each step lists the findings it closes (IDs from [ARCHITECTURE_REVIEW.md §12](ARCHITECTURE_REVIEW.md#12-findings-register)), what to do, the fix itself, how to verify it, and when it's done.

**Do the phases in order.** Phase 0 closes holes that are exploitable in the live project **today**.

| Label | Meaning |
|---|---|
| ✔ **verified** | This exact code or SQL was applied to a copy of the project: SQL on Postgres 17 (production-like and full-repo states, run twice), TypeScript with `tsc` and `next build` |
| ✎ **sketch** | A design to adapt; not tested as-is |

| Phase | Goal | Effort (1 dev) |
|---|---|---|
| [0. Contain](#phase-0--contain-today) | Stop the data exposure, get a green build | 1.5–2 days |
| [1. Secure foundation](#phase-1--secure-foundation) | Reproducible schema, real authorisation, server-side audit | 9–13 days |
| [2. Make features real](#phase-2--make-the-features-real) | Every visible feature works against the real schema | 22–30 days |
| [3. Production quality](#phase-3--production-quality) | Data model, mobile, Amharic, tests, operations, privacy | 24–33 days |
| **Total** | | **≈ 57–78 developer-days** |

Files used by this guide:

| File | Purpose |
|---|---|
| [`db/migrations/`](../db/migrations/) | The schema as **dbmate** migrations, each with `-- migrate:up` and `-- migrate:down`. `npm run db:up` / `db:down` / `db:status` |
| [`db/scripts/inspect_schema.sql`](../db/scripts/inspect_schema.sql) | Read-only: what is really deployed |
| [`db/scripts/emergency_lockdown.sql`](../db/scripts/emergency_lockdown.sql) | Phase 0 paste-in version of migration `20261019000001` (anon lockdown, sign-up fix, role model, profile/finance policies) |
| [`db/scripts/adopt_existing_database.sql`](../db/scripts/adopt_existing_database.sql) | One-time: tells dbmate which migrations a hand-built database already has |
| [`20261019000002_rls_rewrite`](../db/migrations/20261019000002_rls_rewrite.sql) | Every RLS policy rebuilt from the role matrix; storage policies |
| [`20261019000003_audit_triggers`](../db/migrations/20261019000003_audit_triggers.sql) | Trigger-based, tamper-proof audit log |
| [`20261019000004_schema_hardening`](../db/migrations/20261019000004_schema_hardening.sql) | `updated_at`, actor defaults, ETB, constraints, foreign-key indexes |
| [`20261019000005_app_alignment`](../db/migrations/20261019000005_app_alignment.sql) | Schema changes the Phase 2 code fixes need |
| [`db/tests/verify_security.sql`](../db/tests/verify_security.sql) | Executable access checks; fails loudly, cleans up after itself |
| [`db/tests/roundtrip.sh`](../db/tests/roundtrip.sh) | Proves every migration's down exactly reverses its up (`npm run db:test`, runs in CI) |


---

## Phase 0 — Contain (today)

### 0.1 Close the doors at the platform level
**Fixes:** F-02, F-10, F-37 · **Effort:** 15 min

Anyone can sign up today. The public GitHub repo has published demo logins, including a confirmed **admin**, so treat those passwords as burned.

1. Supabase Dashboard → **Authentication → Sign In / Providers** → turn **off** "Allow new users to sign up". Members get invited by an admin instead (Auth → Users → Invite).
2. Supabase Dashboard → **Authentication → Users**: search `@church.local`. In the production project, **delete** these demo users, or at least reset their passwords. Their passwords were public in `scripts/setup-demo-accounts.js`, `scripts/legacy/005_demo_accounts.sql` and `docs/DEMO_SETUP.md` until this change, and they remain in git history.
3. The real anon key, service-role key, JWT secret and database password were **never** committed, so you don't need to rotate them. The project ref was committed (`docs/TROUBLESHOOTING.md`); it's public anyway because it's in every browser bundle, so no action is needed.
4. Authentication → URL Configuration: set **Site URL** to the real app URL (and `http://localhost:3000` under Redirect URLs for development).

**Done when:** sign-up is disabled, and no `@church.local` user with a published password exists in production.

### 0.2 Take a backup and inspect what's really deployed
**Fixes:** F-17, F-39 · **Effort:** 30 min

1. Back up before changing anything: Dashboard → **Database → Backups** (paid plans), or from a terminal:
   ```bash
   # Session-pooler connection string from Dashboard → Connect
   pg_dump "$DB_URL" --no-owner --format=custom --file=lkhc-$(date +%F).dump
   ```
2. Run [`inspect_schema.sql`](../db/scripts/inspect_schema.sql) (read-only) in the SQL editor and save the output. It shows which migrations are applied, every policy, which tables `anon` can read, every admin account, and the demo accounts.

**Done when:** a dated backup file exists, and the inspect output is saved with your notes.

### 0.3 Lock the database now
**Fixes:** F-01, F-02, F-03, F-04 · **Effort:** 15 min · ✔ **verified**

Paste [`db/scripts/emergency_lockdown.sql`](../db/scripts/emergency_lockdown.sql) into the SQL editor and run it. It is the same SQL as migration `20261019000001` (CI checks they match), so dbmate re-applying it later in step 1.1 is harmless. It is idempotent and works on the live project's current state. It:
- revokes all table access from `anon`; the app never reads tables before login;
- makes `profiles.role` the single role column (with a CHECK), keeping `is_admin` in sync for old code;
- adds `current_app_role()` / `has_role(...)`: `SECURITY DEFINER` helpers that avoid the 42P17 recursion that led to the `USING (true)` policies;
- rewrites the sign-up trigger so metadata can never grant privileges;
- adds a trigger so only admins (or the SQL editor) can change `role`, `is_active` or `id`;
- replaces the policies on `profiles` and `financial_transactions`.

The last query lists every privileged account. **Demote anyone you don't recognise:** the sign-up hole (F-02) may have been used.
```sql
UPDATE public.profiles SET role = 'member' WHERE email = 'unknown@example.com';
```

> What changes for users: admins keep full access (the current layout reads `is_admin`, which 01 keeps in sync with `role`). Members can no longer read finances or the member directory, which is intended. `elder`, `ministry_leader` and `finance` users still see the 3-item member menu until Step 1.2 makes the layout read `role`.

### 0.4 Prove it
**Fixes:** verifies F-01..F-04 · **Effort:** 10 min · ✔ **verified**

1. Run [`verify_security.sql`](../db/tests/verify_security.sql). "Success" means every check passed. Otherwise it raises an error listing each failed check and leaves nothing behind. (Against the repo's current policies it reports 14 failures.)
2. From any machine, confirm anonymous access is gone:
   ```bash
   curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=id&limit=1" \
     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
   # expected: {"code":"42501", ... "permission denied for table profiles"}
   ```

### 0.5 Make the build green and patch dependencies
**Fixes:** F-23, F-12 · **Effort:** 0.5 day · ✔ **verified** (`tsc` exits 0, `next build` passes)

1. Commit the pending fixes in `app/api/financial/route.ts` (removes the undefined `txType()` call) and `app/dashboard/ministry/spiritual-service/page.tsx` (replaces a comma-operator ternary at line 185 that fails type-checking). Both break the build on `main`.
2. Fix the sidebar type error:
   ```diff
   --- components/sidebar.tsx
   -  const ministryItem = { href: '/dashboard/ministry', labelKey: 'nav.ministries', icon: Building2, roles: [ROLES.admin, ROLES.elder, ROLES.ministry_leader] as const }
   -  const ministryNavItems = (hasFullAccess || ministryItem.roles.includes(role as keyof typeof ROLES)) ? [ministryItem] : []
   +  const ministryItem = { href: '/dashboard/ministry', labelKey: 'nav.ministries', icon: Building2, roles: [ROLES.admin, ROLES.elder, ROLES.ministry_leader] as string[] }
   +  const ministryNavItems = (hasFullAccess || ministryItem.roles.includes(role)) ? [ministryItem] : []
   ```
3. Patch dependencies. Next 16.0.10 has a critical advisory, fixed in 16.4.x:
   ```bash
   npm install next@^16.4.2
   npm audit fix          # non-breaking fixes for the rest
   npm run build && npm audit --omit=dev
   ```

**Done when:** `npm run build` passes and `npm audit --omit=dev` shows no critical or high issues.

### 0.6 Stop the project from silently disappearing
**Fixes:** F-39 · **Effort:** 30 min

The production project was paused or deleted on 2026-10-16 and nobody noticed.
- Move production to a paid plan (no auto-pause, daily backups; add Point-in-Time Recovery when available) **or** accept the risk explicitly in writing.
- Add a free uptime check (UptimeRobot, Better Stack) on the app URL and on `https://<project-ref>.supabase.co/auth/v1/health`, alerting the maintainers' email.

---

## Phase 1 — Secure foundation

### 1.1 Make the schema reproducible
**Fixes:** F-17, F-37, F-29 · **Effort:** 2–3 days · ✔ **verified** (migrations, adoption and round trip)

The schema now lives in [`db/migrations/`](../db/migrations/) as **dbmate** migrations. dbmate is to this Node/SQL project what Alembic is to Python: every migration file has a `-- migrate:up` and a `-- migrate:down` section, and dbmate records what's applied in `dbmate.schema_migrations` (outside `public`, so the Supabase API never exposes it).

| Command | Alembic equivalent | Does |
|---|---|---|
| `npm run db:up` | `alembic upgrade head` | apply every pending migration |
| `npm run db:down` | `alembic downgrade -1` | roll back the most recent migration |
| `npm run db:status` | `alembic current` / `history` | list applied and pending migrations |
| `npm run db:new <name>` | `alembic revision -m` | create `db/migrations/<timestamp>_<name>.sql` |
| `npm run db:test` | — | prove every down reverses its up (CI) |

The commands migrate whatever `DATABASE_URL` points to (`.env.local` or the environment), so keep it on local or staging; production is migrated by the deploy pipeline.

1. **Adopt dbmate on the existing database** (once, after Phase 0). Run [`db/scripts/adopt_existing_database.sql`](../db/scripts/adopt_existing_database.sql) in the SQL editor: it marks the legacy migrations the database already has. Then, with `DATABASE_URL` pointing at production for this one-time step:
   ```bash
   DATABASE_URL='postgresql://postgres.<ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require' npm run db:status
   DATABASE_URL='…same…' npm run db:up      # applies 011–016 (if missing) and every remediation migration
   ```
   Then run [`db/tests/verify_security.sql`](../db/tests/verify_security.sql). Tested from a live-like state (legacy scripts up to 010) and from a full-legacy state: both end with all security checks passing.
2. **Security rollbacks are locked.** The down sections of `20261019000001_emergency_lockdown` and `20261019000002_rls_rewrite` would re-open anonymous access and self-promotion, so they refuse to run unless the database has `lkhc.allow_insecure_downgrade = on` (`ALTER DATABASE … SET …`). Use that only on dev/test databases, then `RESET` it.
3. **Every change is a migration from now on:** `npm run db:new add_xyz`, write both sections, run `npm run db:up`, `npm run db:down`, `npm run db:up` locally, and let CI's round-trip test confirm the down is exact.
4. The old scripts are archived in [`scripts/legacy/`](../scripts/legacy/) (history only; demo data is not a migration).
5. **Three environments:** local (`npx supabase start`, `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`), a **staging** Supabase project, and production. Point Vercel *Preview* at staging and *Production* at production.
6. **Generated types.** These would have caught every wrong-column bug in the review at compile time:
   ```bash
   npx supabase gen types typescript --db-url "$DATABASE_URL" > lib/supabase/database.types.ts
   ```
   Then type the clients: `createServerClient<Database>(…)` / `createBrowserClient<Database>(…)`.
7. Allow local Supabase URLs in the browser client (it rejected anything that isn't `https://*.supabase.co`). ✔ **done** in branch `feat/db-migrations-and-docs`:
   ```diff
   --- lib/supabase/client.ts
   -  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
   -    throw new Error('Invalid Supabase URL format. Should be: https://your-project.supabase.co')
   -  }
   +  // Validate URL format (any absolute URL: hosted, custom domain, or local `supabase start`)
   +  try {
   +    new URL(supabaseUrl)
   +  } catch {
   +    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL: ' + supabaseUrl)
   +  }
   ```

**Done when:** production is adopted (`npm run db:status` shows nothing pending), and `npm run db:up` builds a working local database from zero.

### 1.2 Use one role model in the app
**Fixes:** F-08 · **Effort:** 1 day · ✔ **verified**

1. Load `role` in the dashboard layout. Today it selects only `is_admin`, so leaders and finance users get the member menu:
   ```diff
   --- app/dashboard/layout.tsx
   -  // Only select 'is_admin' so this works even if 'role' column doesn't exist yet (migration 014).
   -  // Once you run 014, you can change to .select('role, is_admin') and use role for sidebar/API.
      const { data: profile } = await supabase
        .from('profiles')
   -    .select('is_admin')
   +    .select('role')
        .eq('id', user.id)
        .single()

   -  const role = (profile as { role?: string } | null)?.role || 'member'
   -  const isAdmin = profile?.is_admin === true || role === 'admin' || role === 'elder'
   +  const role = profile?.role ?? 'member'
   +  const isAdmin = role === 'admin' || role === 'elder'
   ```
2. Add the shared guard module `lib/auth/guards.ts`:
   ```ts
   import { NextResponse } from 'next/server'
   import { redirect } from 'next/navigation'
   import { createClient } from '@/lib/supabase/server'

   export const ROLES = ['admin', 'elder', 'ministry_leader', 'finance', 'member'] as const
   export type Role = (typeof ROLES)[number]

   /** Current user and their role. role is null when signed out or deactivated. */
   export async function getSession() {
     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return { supabase, user: null, role: null }
     const { data } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
     const role: Role | null = data && data.is_active !== false ? ((data.role as Role) ?? 'member') : null
     return { supabase, user, role }
   }

   /**
    * Route handlers: `const auth = await requireRole('admin', 'finance'); if (auth.error) return auth.error`
    * No roles = any signed-in, active user.
    */
   export async function requireRole(...allowed: Role[]) {
     const { supabase, user, role } = await getSession()
     if (!user) {
       return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
     }
     if (!role || (allowed.length > 0 && !allowed.includes(role))) {
       return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const
     }
     return { error: null, supabase, user, role } as const
   }

   /** Server components / layouts: redirect instead of returning a response. */
   export async function requirePageRole(...allowed: Role[]) {
     const session = await getSession()
     if (!session.user) redirect('/auth/login')
     if (!session.role || (allowed.length > 0 && !allowed.includes(session.role))) redirect('/dashboard')
     return session
   }

   /** Map Supabase/PostgREST errors to safe HTTP responses (no table/column names leak). */
   export function dbError(error: { code?: string; message: string }) {
     console.error('[db]', error.code, error.message)
     if (error.code === '42501') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
     if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
     if (error.code === '23505') return NextResponse.json({ error: 'Already exists' }, { status: 409 })
     if (error.code?.startsWith('23')) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
     return NextResponse.json({ error: 'Server error' }, { status: 500 })
   }
   ```
3. Gate every restricted section with a server layout. Example `app/dashboard/financial/layout.tsx`:
   ```tsx
   import { requirePageRole } from '@/lib/auth/guards'

   // Server-side gate: members who type /dashboard/financial are redirected.
   // RLS (db/migrations/20261019000002_rls_rewrite.sql) still protects the data itself.
   export default async function FinancialLayout({ children }: { children: React.ReactNode }) {
     await requirePageRole('admin', 'elder', 'finance')
     return <>{children}</>
   }
   ```
   Add the same layout to `members` (admin, elder, ministry_leader, finance), `audit-log` (admin, elder), `documents` and `communications` (staff), and `ministry` (staff), following [ROLES_AND_ACCESS.md](ROLES_AND_ACCESS.md).
4. Make `ROLES` in `components/sidebar.tsx` import from `lib/auth/guards.ts` so the matrix lives in one place.

**Done when:** a `member` who types any restricted URL is redirected, and a `finance` user sees Dashboard, Financial, Reports and Settings.

### 1.3 Rewrite all row-level security
**Fixes:** F-05, F-06, F-07 · **Effort:** 1–2 days (including app fallout) · ✔ **verified**

1. Migration [`20261019000002_rls_rewrite`](../db/migrations/20261019000002_rls_rewrite.sql), applied by `npm run db:up` (staging first), drops **every** public policy and recreates them in groups:

   | Group | Read | Write |
   |---|---|---|
   | Member-readable (events, ministries, announcements, schedules…) | any active user | admin, elder, ministry_leader |
   | Staff-only (rosters, attendance, children, baptisms, documents…) | staff | staff |
   | Confidential (counselling, deacon care, charity, workers' aid, prayer, follow-ups) | admin, elder, plus the assigned carer | admin, elder |
   | `profiles` | own row; staff see the directory | own row (guarded); admin |
   | `financial_transactions` | admin, elder, finance; own giving | admin, finance |
   | `audit_log` | admin, elder | triggers only |
   | `documents` table and bucket | by `access_level`: `Public` everyone, `Staff Only` leaders+, `Leadership Only` admin/elder | admin, elder; leaders for non-leadership docs |

   Any table it doesn't know becomes deny-all and is listed at the end, so classify it deliberately.
2. Run `verify_security.sql` again.
3. Click through every page as each role (Phase 3.6 automates this). Anything that broke was relying on the old open policies.

### 1.4 One guarded, validated API pattern
**Fixes:** F-03 (app side), F-13, F-25 · **Effort:** 3–4 days · ✔ **verified** (example route)

Rewrite every route on top of `lib/auth/guards.ts` plus a zod schema. Reference implementation, `app/api/profile/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'

// Only these fields can be changed by the user. Unknown keys (role, is_admin, id…) are rejected.
const ProfileUpdate = z
  .object({
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().max(100),
    phone: z.string().trim().max(30).nullable(),
    address: z.string().trim().max(300).nullable(),
    city: z.string().trim().max(100).nullable(),
    country: z.string().trim().max(100).nullable(),
    date_of_birth: z.string().date().nullable(),
  })
  .partial()
  .strict()

export async function GET() {
  const auth = await requireRole()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase.from('profiles').select('*').eq('id', auth.user.id).single()
  if (error) return dbError(error)
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error

  const parsed = ProfileUpdate.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', auth.user.id)
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data)
}
```
Checklist for every route:
- [ ] `requireRole(...)` first, before `req.json()`
- [ ] a zod schema with `.strict()`; never spread `body` into `.insert()` or `.update()`
- [ ] `dbError()` instead of `error.message`
- [ ] list endpoints take `?limit` (default 50, max 200) and `?cursor`/`?page`; never an unbounded `select('*')`
- [ ] escape user input used in `.or()` / `.ilike()` (`%`, `_`, `,`, `(`, `)`)
- [ ] mutations that RLS can silently skip use `.select()` and return 404 when 0 rows come back

### 1.5 Move the audit trail into the database
**Fixes:** F-09 · **Effort:** 0.5–1 day · ✔ **verified**

1. Migration [`20261019000003_audit_triggers`](../db/migrations/20261019000003_audit_triggers.sql) (applied by `npm run db:up`): triggers on money, people, permissions and pastoral tables record the real caller. Confidential tables log only *which fields* changed. App users can no longer insert audit rows.
2. Delete `lib/audit.ts` and every `logAudit(...)` call (calendar, attendance, financial, members, ministries), and delete the `POST` handler in `app/api/audit-log/route.ts`.
3. In the audit `GET`, replace the `is_admin` check with `requireRole('admin', 'elder')`, and replace the "table missing → `[]`" branch with `dbError`. A missing table must be loud.

**Done when:** editing a transaction as a finance user creates an `audit_log` row showing that user's email and the old and new amounts.

### 1.6 Harden the schema
**Fixes:** F-14, F-15, F-16 · **Effort:** 0.5–1 day · ✔ **verified**

Migration [`20261019000004_schema_hardening`](../db/migrations/20261019000004_schema_hardening.sql) (applied by `npm run db:up`) adds `updated_at` triggers (on about 25 tables), defaults actor columns (`recorded_by_id`, `organizer_id`, …) to `auth.uid()`, sets currency to ETB, and adds `amount > 0` and `end_date >= start_date` (as `NOT VALID`) plus missing foreign-key indexes. Fix the rows its final query lists, then run the two `VALIDATE CONSTRAINT` lines.

### 1.7 Refresh sessions with `proxy.ts`
**Fixes:** F-11 · **Effort:** 1–2 hours · ✔ **verified** (build shows `ƒ Proxy (Middleware)`; signed-out `/dashboard/*` redirects to `/auth/login`)

Create `proxy.ts` in the project root:
```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Runs before every matched request: refreshes the Supabase session cookie and
// sends signed-out visitors away from /dashboard.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```
and point the template's guard at the real app:
```diff
--- lib/supabase/proxy.ts
-  if (
-    // if the user is not logged in and the app path, in this case, /protected, is accessed, redirect to the login page
-    request.nextUrl.pathname.startsWith('/protected') &&
-    !user
-  ) {
+  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
```

### 1.8 Security headers and abuse limits
**Fixes:** F-38 · **Effort:** 0.5 day · ✔ **verified** (headers served by `next start`)

Replace the redundant `env` block in `next.config.ts`:
```ts
  // NEXT_PUBLIC_* variables are inlined automatically; no `env` block needed.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ]
  },
```
Then: Supabase Auth → **Rate Limits** (keep the defaults on), enable CAPTCHA on auth if sign-up is ever reopened, and add a Content-Security-Policy once the third-party origins are known.

---

## Phase 2 — Make the features real

### 2.1 Choose one data path
**Fixes:** F-24 · **Effort:** 2–3 days

- **Reads:** server components (`await requirePageRole(...)`, then query) wherever possible. Client components get data as props, or call a typed route.
- **Writes:** only route handlers or server actions that use `requireRole` and zod. Remove `supabase.from(...).insert/update/delete` from the 11 client files: members, register, financial, calendar, events, attendance, ministries, reports, settings, sidebar (sign-out stays), select-member-modal.
- Add ESLint `no-restricted-imports` so `@/lib/supabase/client` can only be imported by `app/auth/**` and `components/sidebar.tsx`.

### 2.2 Financial ledger
**Fixes:** F-18 · **Effort:** 1–1.5 days · ✔ **verified**

1. Migration [`20261019000005_app_alignment`](../db/migrations/20261019000005_app_alignment.sql) (applied by `npm run db:up`) normalises `transaction_type` to `income`/`expense`, moves the old label (Tithe, Offering…) into `category`, makes amounts positive, and adds a CHECK.
2. Read and write the real columns:
   ```diff
   --- app/dashboard/financial/page.tsx
   -      const txns = data || []
   +      // DB column is transaction_type ('income' | 'expense'); amount arrives as a string (numeric)
   +      const txns: Transaction[] = (data || []).map((t) => ({
   +        ...t,
   +        type: t.transaction_type === 'expense' ? 'expense' : 'income',
   +        amount: Number(t.amount) || 0,
   +      }))
          setTransactions(txns)
   …
           .insert([{
   -          ...formData,
   +          transaction_type: formData.type,
   +          category: formData.category || null,
              amount: parseFloat(formData.amount.toString()),
   +          description: formData.description || null,
   +          transaction_date: formData.transaction_date,
   +          // recorded_by_id defaults to auth.uid() (db/migrations/20261019000004_schema_hardening.sql)
            }])
   ```
3. Compute totals in the database, not from the latest 50 rows in the browser. ✎ **sketch:**
   ```sql
   CREATE VIEW public.financial_summary WITH (security_invoker = on) AS
   SELECT date_trunc('month', transaction_date) AS month, transaction_type, category, sum(amount) AS total
     FROM public.financial_transactions GROUP BY 1, 2, 3;
   ```
4. Format money as Birr: `new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(n)`.
5. Use `AlertDialog` to confirm deletes. Prefer reversing entries to deleting (only admins can delete, per 02).

### 2.3 Calendar and events
**Fixes:** F-19 · **Effort:** 0.5–1 day · ✔ **verified** (payload)

Migration `20261019000005_app_alignment` adds `events.ministry_id`. Send the NOT NULL `start_date` and the foreign key instead of the nonexistent `ministry` text column:
```diff
--- app/dashboard/calendar/page.tsx
         event_type: 'event',
+        // start_date is NOT NULL in the schema; event_date/event_time are kept for display
+        start_date: new Date(`${formData.event_date}T${formData.event_time || '00:00'}`).toISOString(),
         location: formData.location || null,
         description: formData.description || null,
-        ministry: formData.ministry || null,
+        ministry_id: formData.ministry || null, // select value = ministries.id
```
Change the form's ministry `<select>` to list `ministries` (`id` as the value, `name` as the label), and display `ministries(name)` via a join. Later, retire `event_date`/`event_time` in favour of `start_date`/`end_date` (one source of time).

### 2.4 Member registration
**Fixes:** F-20 (interim), F-27 · **Effort:** 3–4 days

1. Migration `20261019000005_app_alignment` gives `profiles.id` a default, so registration without a login account stops failing. This is a stopgap until Step 3.1.
2. Save the whole form. Define one zod schema mirroring [MEMBER_REGISTRATION_FORM_STRUCTURE.md](MEMBER_REGISTRATION_FORM_STRUCTURE.md); validate it in `POST /api/members`; store core fields in columns and the rest in a `details jsonb` column until the model is normalised (3.1).
3. Upload the photo and ID image to a private `member-files` bucket (policy: staff only) and store the paths.
4. Children: save them (create linked member records), or remove the "Child added" control. Never show success for unsaved data.
5. Treat national-ID numbers and income ranges as sensitive: staff-only columns, or a separate staff-only table (see 3.10).

### 2.5 Attendance and reports
**Fixes:** F-21, F-28, F-30 · **Effort:** 1.5–2 days · ✔ **verified** (reports query fix)

1. Use the table that exists. Migration `20261019000005_app_alignment` adds `attendance_records.event_id`:
   ```diff
   --- app/dashboard/reports/page.tsx
   -        supabase.from('financial_transactions').select('type, amount'),
   -        supabase.from('attendance').select('id', { count: 'exact', head: true }),
   +        supabase.from('financial_transactions').select('transaction_type, amount'),
   +        supabase.from('attendance_records').select('id', { count: 'exact', head: true }),
   ```
   Update `app/api/attendance/route.ts` and `app/dashboard/attendance/page.tsx` the same way (`attendance_records`, `event_id`, `recorded_by_id`).
2. Delete the hard-coded "Growth Trends" percentages, the "Avg attendance = total ÷ 4", and the "System Status: Operational" card. Compute real metrics with SQL views (as in 2.2), or show nothing.

### 2.6 Scope ministry leaders to their own ministry
**Fixes:** F-06 (refinement) · **Effort:** 2–3 days · ✎ **sketch**

```sql
-- leader of a ministry = ministry_members.role in ('leader','co_leader') for that ministry
CREATE OR REPLACE FUNCTION public.leads_ministry(p_ministry_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.has_role('admin', 'elder')
      OR EXISTS (SELECT 1 FROM public.ministry_members mm
                  WHERE mm.ministry_id = p_ministry_id
                    AND mm.member_id = (SELECT auth.uid())
                    AND mm.role IN ('leader', 'co_leader')
                    AND mm.is_active IS NOT FALSE)
$$;
```
Add `ministry_id` to ministry-specific tables (choir, worship team, women, youth, children…), then replace the `staff` write policies from 02 with `USING ((SELECT public.leads_ministry(ministry_id)))`.

### 2.7 Wire the 12 mock ministry pages
**Fixes:** F-26, F-28 · **Effort:** 8–10 days (about 0.75 day per page)

Pages: administration, charity, children, choir, deacons, marriage-family, mission, prayer-groups, stage-worship, teaching, workers-aid, youth. For each:
1. Delete the `MOCK_*` constants.
2. Follow the **Women** or **Spiritual Service** page as the template (real API, toasts, loading and empty states, dialog confirms).
3. Use the existing routes where they exist (admin-tasks, charity-aid-requests, children-classes, choir-members/songs, deacon-care-visits, mission-trips, prayer-groups/requests, workers-aid-beneficiaries), rewritten to the 1.4 pattern. Add routes for the tables with no API (worship teams/equipment/rehearsals, marriage seminars, teaching materials, youth mentorship, choir schedule, charity distributions, workers-aid disbursements, deacon support cases, mission reports).
4. Replace the hub's 14 count requests and invented numbers with one query (`ministry_members` grouped by `ministry_id`).

Ship one ministry per pull request.

### 2.8 Delete the dead surface
**Fixes:** F-26 · **Effort:** 1–1.5 days

- Orphan pages (linked from nowhere; 8 of them call missing tables): `app/dashboard/{community, counseling, education, facilities, health, media, music, spiritual-service, worship, youth}`. `ministry/spiritual-service` and `ministry/youth` replace the last two. Keep a feature only by wiring it into the sidebar and the 1.4 pattern. (`app/dashboard/attendance` is also orphaned, but it's fixed and linked in 2.5 instead of deleted.)
- Their API routes: `app/api/{community, counseling, education, facilities, health, media, music, worship}` (tables don't exist), plus `spiritual-service` and `youth` if their pages go.
- Dead code: `components/modals/member-modal.tsx`, `components/language-switcher.tsx`, `app/providers/language-provider.tsx`.

### 2.9 Reliability UX
**Fixes:** F-31, F-30 · **Effort:** 2–3 days

- Every failed request shows a toast, never just `console.error`.
- Submit buttons are `disabled={saving}`.
- `AlertDialog` replaces `confirm()` and `alert()` (`documents/page.tsx` still uses `alert`).
- Add `app/dashboard/error.tsx`, `not-found.tsx` and `loading.tsx`.
- Add pagination on members, transactions, documents and the audit log.

### 2.10 Complete the auth flows
**Fixes:** F-35 · **Effort:** 1 day · ✔ **verified** (route builds; rejects `next=//evil.example`)

`app/auth/confirm/route.ts`:
```ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Target of the confirmation / invite / password-reset email links.
// Email template link: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard' // no open redirects

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) redirect(safeNext)
  }
  redirect('/auth/error')
}
```
Then:
1. Update the Supabase email templates (Confirm sign-up, Invite, Reset password) to link to `/auth/confirm` (with `type=recovery&next=/auth/update-password` for resets).
2. Add `/auth/forgot-password`, which calls `supabase.auth.resetPasswordForEmail(email)`.
3. Add `/auth/update-password`, which calls `supabase.auth.updateUser({ password })`.

---

## Phase 3 — Production quality

### 3.1 Separate people from accounts
**Fixes:** F-20 · **Effort:** 4–6 days · ✎ **sketch**

```sql
CREATE TABLE public.members (            -- every person the church knows
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  father_name text,
  grandfather_name text,
  gender text CHECK (gender IN ('male', 'female')),
  date_of_birth date,
  phone text,
  email text,
  membership_status text NOT NULL DEFAULT 'active'
    CHECK (membership_status IN ('visitor', 'active', 'inactive', 'transferred', 'deceased')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,   -- registration answers not yet normalised
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ADD COLUMN member_id uuid UNIQUE REFERENCES public.members(id);

-- backfill: one member per existing profile, same uuid, so existing references stay valid
INSERT INTO public.members (id, first_name, father_name, gender, date_of_birth, phone, email)
SELECT id, first_name, last_name, lower(gender), date_of_birth, phone, email FROM public.profiles
ON CONFLICT (id) DO NOTHING;
UPDATE public.profiles SET member_id = id WHERE member_id IS NULL;
```
Then move every `member_id` foreign key (ministry_members, attendance, giving, baptisms, care…) from `profiles` to `members`. Delete registration-only rows from `profiles`. Restore `profiles.id → auth.users(id)`. Add `households` for family links. Registration then creates `members` rows; inviting someone to log in creates the auth user and links `profiles.member_id`.

### 3.2 Consolidate duplicated concepts
**Fixes:** F-22 · **Effort:** 3–5 days

- One `events` table (`ministry_id`, `event_type`, `start_date`/`end_date`) replaces `worship_events`, `spiritual_services`, `choir_schedule`, `women_meetings`, `worship_rehearsals`.
- One `attendance_records (event_id, member_id, status)` replaces the three attendance tables.
- One team-membership table via `ministry_members.role`.
- Record charity and workers-aid payouts as `financial_transactions` with `transaction_type = 'expense'` and a category, so the books balance.

Migrate with views first, then switch the code, then drop the old tables.

### 3.3 Mobile layout
**Fixes:** F-32 · **Effort:** 1.5–2 days

Desktop keeps the fixed sidebar (`hidden md:flex`). On phones, a top bar with a menu button opens the same nav in a Radix `Dialog`/sheet. Content uses `md:ml-64` instead of `ml-64`, page padding becomes `p-4 md:p-8`, and wide tables become stacked cards below `md`. Test at 360–414 px.

### 3.4 Amharic for real
**Fixes:** F-33 · **Effort:** 6–8 days (+ translation time)

1. Extract the roughly 1,500 hard-coded strings into `messages/en.json` and `am.json`, one namespace per page, and keep the key sets in sync with a CI check (`node -e` diff of the keys).
2. Ethiopic font ✔ **verified** (`lib/fonts.ts`):
   ```ts
   import { Varela_Round, Noto_Sans_Ethiopic } from 'next/font/google'
   // Amharic glyphs (Varela Round is Latin-only). Use as: font-family: var(--font-fredoka), var(--font-ethiopic)
   export const noto_ethiopic = Noto_Sans_Ethiopic({
     subsets: ['ethiopic'],
     weight: ['400', '600'],
     variable: '--font-ethiopic',
     display: 'swap',
   })
   ```
   Add `noto_ethiopic.variable` to `<html>` in `app/layout.tsx`, append `var(--font-ethiopic)` to the font stack, and rename `--font-fredoka` to `--font-sans`.
3. Format dates and money with `Intl` in the active locale (ETB). Consider showing Ethiopian calendar dates where the church uses them.
4. Afan Oromo (PRD): add `messages/om.json` once extraction is done.

### 3.5 Accessibility
**Fixes:** F-34 · **Effort:** 2 days

Give the 19 icon-only buttons an `aria-label`, link every `<Label>` to its input with `htmlFor`, swap `text-slate-400` on white for `text-slate-500` or darker, replace the emoji icons, and stop nesting `<Link><Button>` (use `<Button asChild><Link/></Button>`). Run axe in the e2e tests (3.6).

### 3.6 Tests and CI
**Fixes:** F-36 · **Effort:** 4–5 days

`.github/workflows/ci.yml` ✎ **sketch:**
```yaml
name: ci
on: [push, pull_request]
jobs:
  app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://ci-placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ci-placeholder
  database:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      - run: supabase db start          # applies supabase/migrations from zero
      - run: psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f db/tests/verify_security.sql
```
Then add:
- **RLS tests** with pgTAP (`supabase test db`), one file per role group in 02.
- **E2E** with Playwright: log in as each demo role and assert which nav items are visible; that restricted URLs redirect; the key flows (add transaction, add event, register member, schedule meeting).
- **Branch protection:** `main` requires CI to pass and one review. Use small PRs, not mega-commits.

### 3.7 Observability
**Fixes:** F-38 · **Effort:** 1 day

Sentry (`@sentry/nextjs`) for client and server errors; Vercel log drains or Supabase log explorer alerts on 5xx and auth errors; the uptime checks from 0.6. Log the `dbError` code and route, never request bodies (PII).

### 3.8 Backups and disaster recovery
**Fixes:** F-39 · **Effort:** 1 day

Daily backups (plus PITR on production); a weekly `pg_dump` of production to off-site storage the church controls; Storage bucket exports. **Rehearse a restore into staging once a quarter** and write down how long it took (RTO) and how much data was lost (RPO).

### 3.9 Repository hygiene
**Fixes:** F-40 · **Effort:** 0.5–1 day

- Move the `.wav` recordings out of the project folder (already git-ignored by this change).
- Delete `Fredoka/` (28 unused font files, committed), `public/fonts/`, the empty `project/` folder, and the 34 unused dependencies.
- Clear the 114 ESLint warnings.

### 3.10 Privacy and data protection
**Fixes:** F-41 · **Effort:** 1–2 days of engineering, plus church-leadership time

The system holds national-ID numbers, income, family links, counselling and care notes, and children's data.
- Write a short privacy notice and a data-handling policy approved by the church leadership: purpose, who can see what (the 02 matrix), retention periods, and how members request access or deletion.
- Check obligations under Ethiopia's Personal Data Protection Proclamation (No. 1321/2024) with a qualified advisor.
- Minimise collection: don't store national-ID images or income unless they're needed. Encrypt the most sensitive fields (`pgsodium`/Vault) or keep them in staff-only tables.
- Record consent at registration. For children's data, get guardian consent.

---

## Definition of production-ready

- [ ] Phase 0 complete; `verify_security.sql` passes on production
- [ ] `supabase db reset` rebuilds the schema from migrations; production, staging and local match
- [ ] CI is green (types, lint, build, RLS tests, e2e smoke) and required on `main`
- [ ] Every page works for every role as described in [ROLES_AND_ACCESS.md](ROLES_AND_ACCESS.md); no mock data
- [ ] Audit log populated by triggers; admins can review it
- [ ] Backups automated and a restore rehearsed
- [ ] Usable on a phone; Amharic covers every screen
- [ ] Privacy notice approved; sign-up by invitation only
- [ ] [STATUS.md](STATUS.md) updated to say all of the above honestly
