# Troubleshooting

## `getaddrinfo ENOTFOUND <project-ref>.supabase.co` / "Failed to fetch" on login

The app can't reach the Supabase project in `.env.local`.

1. Supabase Dashboard: if the project is **paused** (free tier pauses inactive projects), click **Restore project**. If it was **deleted**, create a new one and rebuild the database ([SETUP.md §3](SETUP.md#3-build-the-database)).
2. `NEXT_PUBLIC_SUPABASE_URL` must be exactly the **Project URL** from Project Settings → API, with the same hostname as in the error, no quotes and no trailing slash. `NEXT_PUBLIC_SUPABASE_ANON_KEY` must come from the same project.
3. Check that the URL opens in a browser (network/DNS).
4. Restart `npm run dev` after editing `.env.local`.

To catch this before users do, see [Remediation 0.6](REMEDIATION_GUIDE.md#06-stop-the-project-from-silently-disappearing) (uptime checks).

## "Missing or invalid settings" when starting or building / "Internal Server Error" on every page

`NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, or was pasted with a space or line break. The message names which one. Since `lib/env.ts`, `next dev`, `next build` and `next start` stop with this message. A deployment built before that check, or without those variables, answers every page with a bare "Internal Server Error".
- **On your computer:** fix `.env.local` (project root, no quotes) and restart `npm run dev`.
- **On Vercel:** Project → **Settings → Environment Variables**. Add both for each environment that's deployed (Production and Preview), then **redeploy**. `NEXT_PUBLIC_*` values are baked in at build time, so changing them doesn't fix a deployment that's already built.

## "Configuration error: Supabase credentials not found" / "Missing Supabase environment variables"

`.env.local` is missing, in the wrong folder (it belongs in the project root), or the variables aren't prefixed with `NEXT_PUBLIC_`. Fix it and restart the dev server.

## "Invalid Supabase URL format"

Fixed: the browser client accepts any valid Supabase URL, including local Supabase (`http://127.0.0.1:54321`) and custom domains.

## "Use camera" on the registration form says permission was denied

Allow the camera for the site in the browser (the camera icon in the address bar). The site's `Permissions-Policy` header allows the camera for the site itself (`camera=(self)`). Before that change it blocked the camera everywhere.

## Port 3000 already in use

`npm run dev -- -p 3001`, or stop the other process: `lsof -ti:3000 -sTCP:LISTEN | xargs kill`.

## I only see Dashboard, Calendar and Settings

Your profile has the `member` role. An admin grants roles ([ROLES_AND_ACCESS.md](ROLES_AND_ACCESS.md#granting-a-role)). Until [Remediation 1.2](REMEDIATION_GUIDE.md#12-use-one-role-model-in-the-app) is applied, the sidebar reads only `is_admin`, so only admins see more than three items.

## "permission denied for table …" (code 42501)

RLS or table privileges blocked the request. Expected for:
- anonymous requests (after remediation 01);
- a role that isn't allowed that data (see the data matrix in [ROLES_AND_ACCESS.md](ROLES_AND_ACCESS.md)).

"only an admin can change role, status or id" means the privilege guard stopped a self-promotion.

## "new row violates row-level security policy for table profiles"

Only admins can insert profiles directly. Normal users get their profile from the sign-up trigger. For member registration, make sure remediation `05_app_alignment.sql` is applied, and register as an admin.

## "infinite recursion detected in policy for relation profiles" (42P17)

Caused by `scripts/001` policies that query `profiles` from a `profiles` policy. The emergency lockdown (migration `20261019000001`) replaces them with the recursion-safe `has_role()` helper. Don't "fix" it by switching policies to `USING (true)`.

## `PGRST205` "Could not find the table … in the schema cache" / `PGRST204` "Could not find the '…' column"

The code expects a table or column that the database doesn't have. Either a migration wasn't applied (run [`inspect_schema.sql`](../db/scripts/inspect_schema.sql) to see which), or the code uses a name that exists nowhere:

| Code uses | Fix |
|---|---|
| table `attendance` | use `attendance_records` ([Remediation 2.5](REMEDIATION_GUIDE.md#25-attendance-and-reports)) |
| `counseling_records`, `health_wellness`, `facility_management`, `media_communications`, `music_ministry`, `worship_services`, `community_service`, `education_training` | orphan routes; remove them ([Remediation 2.8](REMEDIATION_GUIDE.md#28-delete-the-dead-surface)) |
| `financial_transactions.type` | `transaction_type` ([Remediation 2.2](REMEDIATION_GUIDE.md#22-financial-ledger)) |
| `events.ministry` | `events.ministry_id` ([Remediation 2.3](REMEDIATION_GUIDE.md#23-calendar-and-events)) |

After applying a migration in the SQL editor, PostgREST reloads automatically within a few seconds. If it doesn't, run `NOTIFY pgrst, 'reload schema';`.

## Member registration fails: `null value in column "id" of relation "profiles"`

`profiles.id` has no default. Apply `db/migrations/20261019000005_app_alignment.sql` (interim fix; the long-term design is [Remediation 3.1](REMEDIATION_GUIDE.md#31-separate-people-from-accounts)).

## Document upload or download fails

The private `documents` bucket or its policies are missing. `02_rls_rewrite.sql` creates both. Uploads are allowed for admin, elder and ministry_leader only.

## `npm run build` fails with a type error in `components/sidebar.tsx`

Known build blocker. See [Remediation 0.5](REMEDIATION_GUIDE.md#05-make-the-build-green-and-patch-dependencies).

## Build fails fetching fonts

`lib/fonts.ts` loads Google Fonts at build time, so the build machine needs internet access.

## Where to look for server-side errors

Terminal running `npm run dev` (route handlers); Supabase Dashboard → **Logs** (API, Auth, Postgres).
