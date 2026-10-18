# Demo Accounts

> **Development, staging and demo projects only. Never production.** The seed creates a confirmed admin account.
> The demo passwords that used to be printed here were published in the public repository; any project that still has those accounts with those passwords must delete them or reset their passwords ([Remediation 0.1](REMEDIATION_GUIDE.md#01-close-the-doors-at-the-platform-level)).

## Accounts

`scripts/setup-demo-accounts.js` creates 9 confirmed users. **Passwords are not stored in the repo:** the admin uses `DEMO_ADMIN_PASSWORD` and everyone else uses `DEMO_USER_PASSWORD`, both from `.env.local`.

| Email | Role |
|---|---|
| admin@church.local | `admin` |
| leader@church.local | `ministry_leader` |
| youth@church.local | `ministry_leader` (youth) |
| counselor@church.local | `ministry_leader` (counselling) |
| treasurer@church.local | `finance` |
| member@church.local | `member` |
| almaz@church.local | `member` |
| getnet@church.local | `member` |
| marta@church.local | `member` |

## Create them

Prerequisites: the database is built ([SETUP.md §3](SETUP.md#3-build-the-database-new-project)), including remediation `01` (which adds `profiles.role`), and you're on Node ≥ 20.9.

1. In `.env.local` of the **dev/staging** project, set `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_ADMIN_PASSWORD` and `DEMO_USER_PASSWORD` (12+ characters each; e.g. `openssl rand -base64 18`), and set `ALLOW_DEMO_SEED=true`. The script refuses to run without that flag.
2. Run:
   ```bash
   node --env-file=.env.local scripts/setup-demo-accounts.js
   ```
3. Set `ALLOW_DEMO_SEED=false` again.

The script never prints passwords. "User already exists" means the account is already there; delete it in Auth → Users to recreate it.

Don't use `scripts/005_demo_accounts.sql`, `006_demo_sample_data.sql` or `009_corrected_demo_data.sql`. They use placeholder UUIDs, conflict with the script, and fail on a fresh database. Create sample ministries, events and transactions through the app, or (after [Remediation 1.1](REMEDIATION_GUIDE.md#11-make-the-schema-reproducible)) in `supabase/seed.sql`.

## What to try per role

| Sign in as | Expect |
|---|---|
| admin | Every sidebar item; can change roles; audit log fills as you edit |
| treasurer | Dashboard, Financial, Reports, Settings; add and edit transactions |
| leader / youth / counselor | Members, events, communications, documents, ministry pages; no finance or audit log |
| member | Dashboard, Calendar, Settings; restricted URLs redirect (after Remediation 1.2) |

## Reset

Keep the accounts and clear the sample data (SQL editor):
```sql
DELETE FROM public.attendance_records;
DELETE FROM public.financial_transactions;
DELETE FROM public.events;
DELETE FROM public.ministry_members;
DELETE FROM public.ministries;
```
For a full reset, delete the `@church.local` users in Auth → Users and their rows in `public.profiles`, then run the script again.

## Before going live

Delete every `@church.local` account, create real admins by invitation, and keep demo data out of the production project.
