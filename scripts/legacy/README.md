# Legacy SQL scripts (historical, do not run)

These are the scripts the database was originally built from by pasting them into the
Supabase SQL editor. They are kept for history only.

- The schema now lives in **`db/migrations/`** (dbmate, with up and down sections).
  `20260209000000_baseline_core` = 001 + 002 + 003 + 004 + 008, and 011–016 have one
  migration each (016a was identical to 016).
- `005`, `006`, `009` (demo data) and `010` (drops the profiles → auth.users foreign key)
  are not migrations. Demo accounts come from `scripts/setup-demo-accounts.js`.
- `007` was superseded by `008`.

Existing databases built from these scripts: run `db/scripts/adopt_existing_database.sql`
once, then `npm run db:up`. See docs/SETUP.md.
