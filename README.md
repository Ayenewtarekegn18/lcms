# Lebbu Kale Heywet Church: Digital Management Platform

Web platform for church operations: members, ministries, events, finances, communications and documents, in English and Amharic.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 / shadcn/ui · Supabase (Postgres, Auth, Storage)

> ⚠️ **Status: prototype, not production-ready.** The production build currently fails, and the database needs the security fixes in [docs/REMEDIATION_GUIDE.md](docs/REMEDIATION_GUIDE.md) (Phase 0) before it holds real member data. What works today: [docs/STATUS.md](docs/STATUS.md).

## Quick start

```bash
npm install
cp .env.example .env.local      # add your Supabase URL and anon key
npm run dev                     # http://localhost:3000
```

Building the database for a new Supabase project, creating the first admin and deploying are covered in **[docs/SETUP.md](docs/SETUP.md)**.

## Documentation

| | |
|---|---|
| [Setup](docs/SETUP.md) | Install, environment variables, database order, deploy |
| [Status](docs/STATUS.md) | What works and what doesn't, per module |
| [Remediation guide](docs/REMEDIATION_GUIDE.md) | Step-by-step fix plan with code and SQL |
| [Architecture review](docs/ARCHITECTURE_REVIEW.md) | Findings, root causes, target architecture |
| [Architecture](docs/ARCHITECTURE.md) | How the system is built |
| [Roles and access](docs/ROLES_AND_ACCESS.md) | Who can see and do what |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common errors and fixes |

## Scripts

| Command | |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |

## Security

Never commit `.env.local`. The Supabase **service-role key** bypasses all security: keep it out of the browser and out of Vercel. Report security issues privately to the maintainers, not in public issues.
