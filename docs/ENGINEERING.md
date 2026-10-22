# Engineering Guide

How LKHC is built, changed and released. It applies to every change, whoever makes it (people or AI assistants). Setup details are in [SETUP.md](SETUP.md); the fix plan is in [REMEDIATION_GUIDE.md](REMEDIATION_GUIDE.md).

## Principles

1. **Every change goes through a pull request and CI.** Nothing reaches staging or production any other way.
2. **Shared databases change only through migrations applied by the pipeline.** Nobody runs SQL against staging or production by hand. The only exception is an emergency: take a backup first, and write the matching migration straight afterwards.
3. **Small, reversible steps.** Small PRs, backward-compatible migrations, and releases you can roll back.
4. **Secure by default.** Row-level security on every table, role checks on the server, and secrets only in GitHub and Vercel.
5. **Untested means unfinished.** A behaviour that matters has a test that runs in CI.

## Environments

| | Local | CI | Staging | Production |
|---|---|---|---|---|
| **Database** | Your own Supabase in Docker (`npm run local:start`): Postgres, Auth, Storage, Studio, Mailpit | Throwaway: the same local stack for e2e, plain Postgres for the migration round trip | The current Supabase project (test data) | A separate Supabase project, created at go-live on a paid plan (daily backups, no pausing) |
| **App** | `npm run dev` | `next build`, then Playwright | Vercel preview deployment of `main` | Vercel production deployment |
| **Changed by** | You | The pipeline, on every PR | The pipeline, on every merge to `main` | The pipeline, on a published release, after your approval |
| **Data** | Test logins per role and sample data (`scripts/local.mjs`) | The same | Test data | Real members |

Develop and test against the local stack. Nobody's `.env.local` holds a staging or production `DATABASE_URL`.

## How a change flows

```
branch ──► pull request ──► CI ──► merge to main ──► Deploy: staging ──► release vX.Y.Z ──► approve ──► Deploy: production
             (draft early)   types, lint, unit,        migrations, RLS checks,     CI again on the tag     migrations, app
                             audit, migrations,        app (automatic)
                             RLS checks, e2e
```

1. **Branch** from `main`: `feat/…`, `fix/…`, `docs/…`, `ci/…`, `chore/…`. Keep branches short-lived: days, not weeks.
2. **Commit** using [Conventional Commits](https://www.conventionalcommits.org), for example `feat(members): print ID cards`. The type drives the version number and the changelog.
3. **Open a pull request** early. The description says what changed, why, how it was tested, and anything a deploy needs.
4. **Merge** when CI is green. **Squash and merge**, so `main` gets one commit per PR titled with its Conventional Commit.
5. **Staging deploys by itself.** The Deploy workflow applies the migrations, runs the RLS checks against staging and deploys the app. Check the change on staging.
6. **Release to production.** Publish a GitHub release (`vX.Y.Z`). CI runs again on the tag, then the production deploy waits for your approval in the Actions tab.

## Database changes

Migrations live in `db/migrations` and are applied by [dbmate](https://github.com/amacneil/dbmate). Each file has an **up** section and a **down** section.

```bash
npm run db:new add_member_photo_consent    # creates db/migrations/<timestamp>_add_member_photo_consent.sql
npm run db:up && npm run db:down && npm run db:up   # against your local database
npm run db:test                                     # the round trip CI runs
```

Rules:
- **Never edit a migration after it's merged.** Write a new one. Staging and production have already run the old version.
- **Keep the previous release working.** Migrations run before the new app goes live, and an app rollback runs old code on the new schema. So **expand, then contract**:
  - Add tables or nullable columns, and backfill.
  - Ship the code that uses them.
  - Drop or rename the old ones in a later release, once no deployed code uses them.
- **The down section must restore the schema exactly.** CI proves it with the round trip. Downs are for local development and for testing; in production, fix forward with a new migration.
- **Security changes come with checks.** A change to row-level security, grants or `SECURITY DEFINER` functions adds or updates checks in [`db/tests/verify_security.sql`](../db/tests/verify_security.sql). The deploy job runs them against staging after migrating.
- **Data fixes are migrations too.** Corrections (`UPDATE` / `DELETE`) go in a migration, so they are reviewed and recorded.
- **One concern per migration**, and a name that says what it does.

## Pull requests

- **One purpose, small enough to review in one sitting.** Aim for under about 400 changed lines; split refactors from behaviour changes.
- **Required before merging: CI green.** No approving review is required while there is one developer; add it when the team grows.
- **A bug fix includes the test that would have caught it.**
- **Update the docs in the same PR when you change behaviour or setup**, for example [STATUS.md](STATUS.md) for a module or [SETUP.md](SETUP.md) for setup.

## Releases and rollback

- **Versions** follow [semantic versioning](https://semver.org): `vMAJOR.MINOR.PATCH`. Release notes list the user-visible changes and the migrations included.
- **App rollback:** in Vercel, promote or roll back to the previous production deployment, or run **Actions → Deploy → Run workflow** with an earlier tag. Production still waits for approval. Because migrations are backward compatible, the older app works on the newer schema.
- **Database rollback:** fix forward with a new migration. If data was lost, restore from a backup. Production uses Supabase daily backups (paid plan); add point-in-time recovery once it holds real data.

## Supabase settings

Supabase's settings are code too. [`supabase/config.toml`](../supabase/config.toml) lists the ones we choose:
- sign-ups off (invitation only), password rules, site URL and redirect URLs, upload size;
- values that differ per project, in `[remotes.staging]` (and later `[remotes.production]`).

The local stack uses the file. After migrating, the Deploy workflow compares it with the project (`supabase config diff`) and, once `SUPABASE_CONFIG_PUSH` is on for that environment, applies it (`supabase config push`). Only the settings listed in the file are written, and anything else is left alone. **Change these settings in a PR, not in the dashboard:** the next deploy would undo a dashboard change.

## Secrets and configuration

| Where | What |
|---|---|
| GitHub environment `staging` | Secrets `DATABASE_URL` (the staging session-pooler connection string) and `SUPABASE_ACCESS_TOKEN`. Variables `SUPABASE_PROJECT_REF` and `SUPABASE_CONFIG_PUSH` |
| GitHub environment `production` | The same, for production, plus you as **required reviewer** |
| GitHub repository secrets | `VERCEL_TOKEN`, plus `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the keep-warm ping |
| GitHub repository variables | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `APP_URL` |
| Vercel project | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, per environment: Preview → staging, Production → production |
| `.env.local` (git-ignored) | Local development values only |

**Never commit secrets, and never paste them into issues, PRs or chats.** The service-role key and database passwords bypass all security. If one leaks, rotate it in Supabase straight away.

## Definition of done

A change is done when:
- [ ] it meets the acceptance criteria of its issue;
- [ ] it has tests: unit tests for logic, e2e for user flows, and checks in `verify_security.sql` for data access;
- [ ] CI is green, and migrations are reversible and backward compatible;
- [ ] it works on a phone, works with the keyboard, and has its text ready for Amharic (as the [Frontend & UI track](REMEDIATION_GUIDE.md#frontend--ui-track) lands);
- [ ] the docs are updated;
- [ ] it's deployed to staging and checked there.

## Where this guide is going

| Step | What | Status |
|---|---|---|
| 1 | Environments and automatic deploys (this guide, `deploy.yml`) | ✅ |
| 2a | Local development on the Supabase CLI (local Auth, Storage, Studio, Mailpit, test logins and sample data); CI's end-to-end tests use the same stack | ✅ |
| 2b | Supabase settings (sign-ups, URLs, password rules) as code, compared and applied by the Deploy workflow | ✅ |
| 3 | Repository rules as code (branch ruleset, PR and issue templates, CODEOWNERS), automated releases and changelog, CodeQL | ⬜ |
| 4 | Code structure: feature modules, a server-side data layer, database types generated from the schema and checked in CI | ⬜ |
| 5 | Features on that foundation: Phase 2 and the Frontend & UI track; monitoring and alerting before go-live | ⬜ |
