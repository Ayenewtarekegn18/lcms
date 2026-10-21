# Lebbu Kale Heywet Church: Digital Management Platform

Web platform for church operations: members, ministries, events, finances, communications and documents, in English and Amharic.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 / shadcn/ui · Supabase (Postgres, Auth, Storage)

> ⚠️ **Status: not production-ready yet.** The build, the API and page access, the migrations and member registration are fixed, and CI tests every change. The live database still needs the security steps in [docs/REMEDIATION_GUIDE.md](docs/REMEDIATION_GUIDE.md) (Phase 0) before it holds real member data, and several modules still show mock data. What works today: [docs/STATUS.md](docs/STATUS.md).

[![CI](https://github.com/Ayenewtarekegn18/lcms/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayenewtarekegn18/lcms/actions/workflows/ci.yml)

## Quick start

Needs Node.js 22.18+ and Docker Desktop.

```bash
npm install
npm run local:start     # your own Supabase in Docker: migrations, test logins, sample data
npm run dev             # http://localhost:3000, sign in as admin@lkhc.test / Local-Test-Password-1
```

Building the database for a new Supabase project, creating the first admin and deploying are covered in **[docs/SETUP.md](docs/SETUP.md)**.

## Documentation

| | |
|---|---|
| [Engineering guide](docs/ENGINEERING.md) | How changes are made, tested, released and deployed |
| [Setup](docs/SETUP.md) | Install, environment variables, migrations, testing, CI/CD, keep-warm ping |
| [Status](docs/STATUS.md) | What works and what doesn't, per module |
| [Remediation guide](docs/REMEDIATION_GUIDE.md) | Step-by-step fix plan with code and SQL |
| [Architecture review](docs/ARCHITECTURE_REVIEW.md) | Findings, root causes, target architecture |
| [Architecture](docs/ARCHITECTURE.md) | How the system is built |
| [Roles and access](docs/ROLES_AND_ACCESS.md) | Who can see and do what |
| [Member registration](docs/MEMBER_REGISTRATION_FORM_STRUCTURE.md) | The lebu-form register: fields, rules, numbering, import |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common errors and fixes |

## Scripts

| Command | |
|---|---|
| `npm run local:start` / `local:stop` / `local:reset` | Your local Supabase: start (migrate and seed), stop, rebuild from scratch |
| `npm run dev` | Development server (uses the local stack while it's running) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, against the local stack; see [SETUP §6](docs/SETUP.md#6-testing)) |
| `npm run db:new` / `db:up` / `db:down` / `db:status` | Create, apply, roll back or list migrations on your local database |
| `npm run db:test` | Prove every migration reverses cleanly, then run the RLS checks |
| `npm run import:lebu-form` | Import members from the lebu-form register |

## Security

Never commit `.env.local`. The Supabase **service-role key** bypasses all security: keep it out of the browser and out of Vercel. Report security issues privately to the maintainers, not in public issues.
