# Demo Accounts

## Ministry try-out on staging

One login per ministry, for a ministry representative to try their workspace on the staging app. The **Seed demo data** workflow (`.github/workflows/seed-demo.yml`, script `scripts/seed-demo.mjs`) creates:

- a login `<slug>@demo.lkhc.test` per ministry (e.g. `choir@demo.lkhc.test`, `workers-aid@demo.lkhc.test`). Deacons, Charity and Workers' Aid get the `elder` role, because only admins and elders may see that data; the others get `ministry_leader`;
- `finance@demo.lkhc.test` (role `finance`) and `member@demo.lkhc.test` (role `member`), to see the app as the treasurer and as an ordinary member;
- 8 demo members in the register, put on each ministry's roster with the login as leader;
- two upcoming events and a couple of sample rows for every ministry.

It never touches production and is safe to run again: existing logins are reused (their password is reset to `DEMO_PASSWORD`) and a ministry that already has events is left alone.

1. In GitHub → Settings → Environments → **staging**, add two secrets:
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase → Project Settings → API keys → `service_role` (secret).
   - `DEMO_PASSWORD`: the password every demo login gets; 12+ characters with upper and lower case letters and a digit.
   (`SUPABASE_URL` is already there.)
2. Actions → **Seed demo data** → Run workflow. The run's summary lists the logins.
3. Give each representative the staging address, their login and the password. Ask them to add, edit and delete freely: it is test data.

Locally: `DEMO_PASSWORD=… node --env-file=.env.development.local scripts/seed-demo.mjs`.

## Older demo accounts

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

Prerequisites: the database is built with `npm run db:up` ([SETUP.md §3](SETUP.md#3-build-the-database)), which includes the role column, and you're on Node ≥ 20.9.

1. In `.env.local` of the **dev/staging** project, set `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_ADMIN_PASSWORD` and `DEMO_USER_PASSWORD` (12+ characters each; e.g. `openssl rand -base64 18`), and set `ALLOW_DEMO_SEED=true`. The script refuses to run without that flag.
2. Run:
   ```bash
   node --env-file=.env.local scripts/setup-demo-accounts.js
   ```
3. Set `ALLOW_DEMO_SEED=false` again.

The script never prints passwords. "User already exists" means the account is already there; delete it in Auth → Users to recreate it.

Don't use `scripts/legacy/005_demo_accounts.sql`, `006_demo_sample_data.sql` or `009_corrected_demo_data.sql`. They use placeholder UUIDs, conflict with the script, and fail on a fresh database. Create sample ministries, events and transactions through the app, or (after [Remediation 1.1](REMEDIATION_GUIDE.md#11-make-the-schema-reproducible)) in `supabase/seed.sql`.

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
