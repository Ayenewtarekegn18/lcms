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

Supabase's own settings (sign-ups off, password rules, site URL, upload limit) live in [`supabase/config.toml`](../supabase/config.toml), not in the dashboard. The local stack uses them, and the Deploy workflow applies them to staging and production (§7).

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

### Staging Supabase settings

The Deploy workflow compares [`supabase/config.toml`](../supabase/config.toml) with the staging project after each merge, and applies it once you've switched that on. Settings not listed in the file are never touched.
1. [supabase.com](https://supabase.com) → your avatar → **Account preferences → Access Tokens → Generate new token**. Name it `github-actions-lkhc` and give it an expiry, for example one year (put a reminder in your calendar to renew it).
2. GitHub → **Settings → Environments → staging**:
   - secret `SUPABASE_ACCESS_TOKEN`: the token;
   - variable `SUPABASE_PROJECT_REF`: the 20-letter project id, the part before `.supabase.co` in the project URL. It's already in `[remotes.staging]`.
3. **Actions → Deploy → Run workflow** (`staging`, `main`). The run summary's **staging Supabase settings** section lists every difference between the project and the file.
4. If the differences are what you want (for example sign-ups switching off), add the variable `SUPABASE_CONFIG_PUSH` = `true` to the `staging` environment and run Deploy again. From then on every deploy applies the file, and a change made by hand in the dashboard is undone at the next deploy. Change settings in `config.toml`, in a PR.

The token can manage every project in your Supabase account, so it lives only in GitHub's environment secrets. Revoke it in Supabase if it ever leaks.

### App hosting (Vercel)

1. Make sure sign-ups are off **before** the app is reachable online. "Staging Supabase settings" above does that, or switch off "Allow new users to sign up" under Authentication → Sign In / Providers.
2. [vercel.com](https://vercel.com) → **Continue with GitHub** → **Add New… → Project** → import `lcms`. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the staging values from `.env.local`.
   - The Git connection gives every pull request its own preview site.
   - `vercel.json` stops Vercel deploying `main` by itself; the pipeline does that after migrating. The deployment Vercel makes when you first import can be ignored.
3. Vercel → **Account Settings → Tokens** → create a token for GitHub Actions. In GitHub → **Settings → Secrets and variables → Actions**:
   - secret `VERCEL_TOKEN`;
   - variables `VERCEL_ORG_ID` (Vercel → Settings → General → Team ID) and `VERCEL_PROJECT_ID` (project → Settings → General → Project ID).
4. Run **Deploy** for `staging` again. The run summary and the `staging` environment now link to the app.

Preview sites, staging included, are visible only to people signed in to your Vercel account (Vercel's default deployment protection).

### Production (at go-live)

1. Create a **new** Supabase project on a paid plan, for daily backups and no pausing.
2. In a PR, add a `[remotes.production]` block to `supabase/config.toml`: its `project_id`, and `[remotes.production.auth]` with the production domain as `site_url`. Copy the staging block. The pipeline then turns off sign-ups and sets the password rules for it.
3. GitHub environment `production`:
   - secrets `DATABASE_URL` (its session pooler) and `SUPABASE_ACCESS_TOKEN`;
   - variables `SUPABASE_PROJECT_REF` and `SUPABASE_CONFIG_PUSH` = `true`;
   - **Required reviewers**: you.
4. Vercel → project → **Settings → Environment Variables**: give **Production** the new project's URL and anon key.
5. Publish a GitHub release `v1.0.0` (Releases → Draft a new release → new tag). CI runs on the tag, then Deploy waits for your approval. It builds the whole schema on the empty database and deploys the app.
6. Create the first admin: invite yourself (Authentication → Users → Invite), sign in once, then run the `UPDATE public.profiles SET role = 'admin' …` from §4 in the SQL editor. This is the only SQL anyone runs by hand, once per new project.

### Protect `main` (once)

The rules for `main` are in [`.github/rulesets/main.json`](../.github/rulesets/main.json):
- every change comes through a PR;
- the three CI checks must pass and the branch must be up to date with `main`;
- review threads are resolved;
- merges are squash-only;
- no force pushes or deletion;
- an admin may bypass the rules for an emergency fix, visibly in the PR.

To apply them:
1. Download the file: open it on GitHub → **Download raw file**.
2. GitHub → **Settings → Rules → Rulesets → New ruleset → Import a ruleset**, choose the file, then **Create**.
3. **Settings → General → Pull Requests:** tick only **Allow squash merging**, set its default message to **Pull request title and description**, and tick **Automatically delete head branches**.

### Security settings (once)

GitHub → **Settings → Code security**:
- **Private vulnerability reporting: Enable.** People can then report problems privately ([SECURITY.md](../SECURITY.md)).
- **Dependabot security updates: Enable.**
- **Secret scanning** and **Push protection: Enable.** They're free for public repositories, and block a push that contains a key.
- **Code scanning:** leave "Default setup" off. CodeQL runs from [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml), and its results appear under **Security → Code scanning**.

### Releases

Releases → **Draft a new release** → choose a new tag (`v0.3.0`) on `main` → **Generate release notes**. They're grouped by the labels PRs receive automatically. Then **Publish**. CI runs on the tag, then the production deploy waits for your approval (once production exists; see above).

### Dependabot and overrides

[Dependabot](../.github/dependabot.yml) is GitHub's update robot. It proposes newer versions of the packages the app is built on as pull requests; CI tests each one, and nothing merges unless you merge it.
- **npm packages:** at most one combined PR a week for minor and patch updates, plus one for major updates (read their release notes before merging).
- **GitHub Actions steps:** at most one combined PR a month.
- **Cooldown:** a release must be at least 14 days old before it's proposed.
- **Security fixes:** for known vulnerabilities these come separately and straight away, once **Settings → Code security → Dependabot security updates** is on.

The `overrides` in `package.json` hold back two packages of the test tooling (`rolldown` and `tinybench`) to releases at least two weeks old. If a Dependabot PR for `vite` or `vitest` conflicts with them, delete the conflicting override in that PR.

## 8. Keep-warm ping

Free Supabase projects are paused after about a week without activity, and the first request after a quiet spell is slow. [`.github/workflows/keepalive.yml`](../.github/workflows/keepalive.yml) sends one tiny request every 10 minutes: `public.keepalive()` (migration `20261019000007`; returns the time, reads no data) and, if configured, the app's `/api/keepalive`.

1. Apply the migrations to the project (`npm run db:up`, or the deploy job). Until then the ping fails with 404.
2. Repository **Settings → Secrets and variables → Actions**:
   - secrets `SUPABASE_URL` (`https://<project-ref>.supabase.co`) and `SUPABASE_ANON_KEY` (the public anon key);
   - variable `APP_URL`, the deployed site (for example `https://lkhc.vercel.app`), to warm the Vercel function too.
3. Actions → **Keep Supabase warm** → *Run workflow* once and check both lines say `HTTP 200`.

Scheduled workflows run only from `main`, can start several minutes late, and GitHub switches them off after 60 days without commits (it emails you; re-enable from the Actions tab). For a second, independent pinger, create a free monitor at UptimeRobot or cron-job.org for `<APP_URL>/api/keepalive` every 5–10 minutes: it keeps both warm and alerts you when the site or the database is down (the endpoint returns 503 when it can't reach the database).

Problems? See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
