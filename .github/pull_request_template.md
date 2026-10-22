<!-- Title: Conventional Commits, for example "feat(members): print ID cards" or "fix(financial): totals in ETB".
     It becomes the commit on main (squash merge) and the line in the release notes. -->

## What and why

<!-- What does this change, and why? Link the issue it closes: "Closes #123". -->

## How it was tested

<!-- Tests added or updated (unit, e2e, verify_security.sql), and what you checked by hand: locally, on a phone, on staging. -->

## Deploy notes

<!-- Migrations, Supabase settings, secrets or manual steps this needs. Write "None" if nothing. -->

## Checklist ([definition of done](https://github.com/Ayenewtarekegn18/lcms/blob/main/docs/ENGINEERING.md#definition-of-done))

- [ ] CI is green, and the change has tests
- [ ] Migrations have an exact down and keep the previous release working (expand, then contract)
- [ ] Data-access changes have checks in `db/tests/verify_security.sql`
- [ ] Works on a phone and with the keyboard
- [ ] Docs updated where behaviour or setup changed (STATUS.md, SETUP.md …)
