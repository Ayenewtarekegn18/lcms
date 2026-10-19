# Project Status

Honest status of each module, verified on 2026-10-17 by running the app against a database built from this repo (see [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md)). This replaces `CORE_MODULES_CHECKLIST.md`, which marked several broken modules as done.

**Overall:** prototype, **not production-ready**. The production build fails, and the live project's data is exposed until [Remediation Phase 0](REMEDIATION_GUIDE.md#phase-0--contain-today) is applied.

Legend: ✅ works · 🟡 partly works · ❌ broken · 🎭 mock data only · ⬜ not built

## Core modules

| # | Module | Status | What works / what doesn't | Fix |
|---|---|---|---|---|
| 1 | Members and registration | ❌ / 🟡 | List, search, edit and deactivate work for staff. **Registration fails** (null `id`) and saves only about 10 of 50 fields; photo and ID uploads and children are dropped | [2.4](REMEDIATION_GUIDE.md#24-member-registration), [3.1](REMEDIATION_GUIDE.md#31-separate-people-from-accounts) |
| 2 | Ministries | 🟡 | `/dashboard/ministries` lists and adds. The hub's member counts are invented numbers | [2.7](REMEDIATION_GUIDE.md#27-wire-the-12-mock-ministry-pages) |
| 3 | Attendance | ❌ | Page and API use a table `attendance` that doesn't exist; the page isn't linked | [2.5](REMEDIATION_GUIDE.md#25-attendance-and-reports) |
| 4 | Financial | ❌ | Lists rows, but every row shows as "Expense" and totals are $0; **adding a transaction fails silently**; CSV export works | [2.2](REMEDIATION_GUIDE.md#22-financial-ledger) |
| 5 | Events and calendar | 🟡 | Calendar shows events; **adding an event fails** (`ministry` column, missing `start_date`) | [2.3](REMEDIATION_GUIDE.md#23-calendar-and-events) |
| 6 | Communications | ✅ / ⬜ | Announcements and templates save (when `011` is applied; it wasn't on the live project). No SMS, email, Telegram or WhatsApp delivery | [0.2](REMEDIATION_GUIDE.md#02-take-a-backup-and-inspect-whats-really-deployed) |
| 7 | Documents | 🟡 | Upload, list, search and signed download. Needs bucket policies; `access_level` not enforced; no delete | [1.3](REMEDIATION_GUIDE.md#13-rewrite-all-row-level-security) |
| 8 | Reports | ❌ | Member, ministry and event counts are real; income is $0 (wrong column); attendance fails; "Growth Trends" are hard-coded | [2.5](REMEDIATION_GUIDE.md#25-attendance-and-reports) |
| 9 | Access control and audit | ❌ | Roles only hide sidebar links; anyone can make themselves admin; audit log written by the browser (0 entries in a full test session) | [Phase 0](REMEDIATION_GUIDE.md#phase-0--contain-today), [1.2](REMEDIATION_GUIDE.md#12-use-one-role-model-in-the-app)–[1.5](REMEDIATION_GUIDE.md#15-move-the-audit-trail-into-the-database) |

## Ministry modules (14)

| Ministry | Status |
|---|---|
| Spiritual Service | ✅ real APIs (needs `015` applied) |
| Women | ✅ real APIs (needs `015` applied); some summary figures are hard-coded |
| Administration, Charity, Children, Choir, Deacons, Marriage and Family, Mission, Prayer Groups, Stage and Worship, Teaching, Workers' Aid, Youth | 🎭 hard-coded `MOCK_*` data; actions don't save. Tables exist in `015`; about half have unused API routes ([2.7](REMEDIATION_GUIDE.md#27-wire-the-12-mock-ministry-pages)) |

11 further pages under `app/dashboard/` (attendance, community, counseling, education, facilities, health, media, music, spiritual-service, worship, youth) aren't linked from anywhere, and 8 of them call tables that don't exist ([2.8](REMEDIATION_GUIDE.md#28-delete-the-dead-surface)).

## Cross-cutting

| Area | Status |
|---|---|
| Production build | ❌ type error ([0.5](REMEDIATION_GUIDE.md#05-make-the-build-green-and-patch-dependencies)) |
| Database reproducible from repo | 🟡 only in the order given in [SETUP.md](SETUP.md); no migration tooling ([1.1](REMEDIATION_GUIDE.md#11-make-the-schema-reproducible)) |
| English / Amharic | 🟡 infrastructure works; about 1% of the UI is translated ([3.4](REMEDIATION_GUIDE.md#34-amharic-for-real)) |
| Mobile | ❌ fixed sidebar ([3.3](REMEDIATION_GUIDE.md#33-mobile-layout)) |
| Tests / CI | ⬜ ([3.6](REMEDIATION_GUIDE.md#36-tests-and-ci)) |
| Backups / monitoring | ⬜ ([0.6](REMEDIATION_GUIDE.md#06-stop-the-project-from-silently-disappearing), [3.7](REMEDIATION_GUIDE.md#37-observability), [3.8](REMEDIATION_GUIDE.md#38-backups-and-disaster-recovery)) |

## PRD features not built yet

Two-factor auth; recurring events, RSVP and reminders; SMS, email and messaging delivery; budget approval workflow; online payments; member self-service (own profile, own giving history); PDF/Excel reports; Afan Oromo; multi-branch; offline use. See [PRD.md](PRD.md).

*Update this page whenever a remediation step lands.*
