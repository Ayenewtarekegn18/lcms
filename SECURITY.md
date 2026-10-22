# Security policy

This app holds personal data about church members, so security problems matter to us.

## Reporting a vulnerability

**Please don't open a public issue.** Report it privately on GitHub: this repository → **Security → Report a vulnerability**, or [open a private report](https://github.com/Ayenewtarekegn18/lcms/security/advisories/new).

Include what you found, how to reproduce it, and what someone could do with it. We aim to reply within 7 days, and to keep you informed until it's fixed. Please give us a reasonable time to fix it before telling anyone else.

Never include real members' personal data, passwords or keys in a report.

## What counts

Anything that lets someone read or change data they shouldn't, act as another user or role, or bypass the role and row-level-security rules described in [docs/ROLES_AND_ACCESS.md](docs/ROLES_AND_ACCESS.md).

## How we keep it secure

[docs/ENGINEERING.md](docs/ENGINEERING.md) lists the practices:
- row-level security on every table, checked by `db/tests/verify_security.sql` in CI and on every staging deploy;
- server-side role checks on every page and API route;
- secrets only in GitHub and Vercel, never in the repository;
- dependency updates (Dependabot) and code scanning (CodeQL).
