# Project Status

Honest status of each module, verified on 2026-10-17 by running the app against a database built from this repo (see [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md)), and updated on 2026-10-19 for the fix branches listed in [REMEDIATION_GUIDE → Progress](REMEDIATION_GUIDE.md#progress). This replaces `CORE_MODULES_CHECKLIST.md`, which marked several broken modules as done.

**Overall:** **not production-ready**. Once the fix branches are merged, the build passes, page and API access follow the role model, the schema is reproducible and member registration works, all tested in CI. The live project's data stays exposed until [Remediation Phase 0](REMEDIATION_GUIDE.md#phase-0--contain-today) is applied to it, and several modules below are still broken or show mock data.

Legend: ✅ works · 🟡 partly works · ❌ broken · 🎭 mock data only · ⬜ not built

## Core modules

| # | Module | Status | What works / what doesn't | Fix |
|---|---|---|---|---|
| 1 | Members and registration | ✅ / 🟡 | Registration follows the lebu-form register: every field, children and household rows, photo, `LKH-` member numbers, importer for existing records (e2e-tested). List, search, edit and deactivate work for staff. Not yet: editing a member's registry record, "My ID" and ID-card printing | [2.4](REMEDIATION_GUIDE.md#24-member-registration), [FE.8](REMEDIATION_GUIDE.md#fe8-lebu-form-parity), [3.1](REMEDIATION_GUIDE.md#31-separate-people-from-accounts) |
| 2 | Ministries | ✅ | `/dashboard/ministries` lists and adds; the ministry hub shows each ministry's real member and upcoming-event counts and opens its workspace | [2.7](REMEDIATION_GUIDE.md#27-wire-the-12-mock-ministry-pages), [MINISTRY_WORKSPACES.md](MINISTRY_WORKSPACES.md) |
| 3 | Attendance | ✅ | Staff pick an event (and day), mark members present/absent/late and save in one go; counts per event; one record per member, event and day. Linked in the sidebar for staff | [2.5](REMEDIATION_GUIDE.md#25-attendance-and-reports) |
| 4 | Financial | ✅ | Income and expenses in Birr; totals (all-time, this month, by category) computed in the database; finance and admin record, only admin deletes (with confirmation); CSV export of the filtered rows | [2.2](REMEDIATION_GUIDE.md#22-financial-ledger) |
| 5 | Events and calendar | ✅ | Staff create, edit and delete events linked to a ministry; the calendar shows the month; everyone can view, only staff see add buttons | [2.3](REMEDIATION_GUIDE.md#23-calendar-and-events) |
| 6 | Communications | ✅ / ⬜ | Announcements and templates save (when `011` is applied; it wasn't on the live project). No SMS, email, Telegram or WhatsApp delivery | [0.2](REMEDIATION_GUIDE.md#02-take-a-backup-and-inspect-whats-really-deployed) |
| 7 | Documents | 🟡 | Upload, list, search and signed download. Needs bucket policies; `access_level` not enforced; no delete | [1.3](REMEDIATION_GUIDE.md#13-rewrite-all-row-level-security) |
| 8 | Reports | ✅ | Real counts (members, ministries, upcoming events, attendance) and, for roles that can see the ledger, income and expense; CSV export. The invented "Growth Trends" and status figures are gone | [2.5](REMEDIATION_GUIDE.md#25-attendance-and-reports) |
| 9 | Access control and audit | 🟡 | In the code: server-side page gates and API guards per role, validated input (no self-promotion to admin), audit log written by database triggers; e2e-tested for every role. **On the live project:** not until the Phase 0 SQL and the migrations are applied | [Phase 0](REMEDIATION_GUIDE.md#phase-0--contain-today), [1.1](REMEDIATION_GUIDE.md#11-make-the-schema-reproducible) |

## Ministry modules (14)

| Ministry | Status | Tabs (besides Overview, Members and Events) |
|---|---|---|
| Administration | ✅ | Tasks (assignee, due date, overdue flag) |
| Charity | ✅ admin and elder only | Aid requests (review recorded), Distributions, totals |
| Children | ✅ | Classes, Teachers, Curriculum, Class attendance |
| Choir | ✅ | Voice parts, Songs, Schedule |
| Deacons | ✅ admin and elder only | Care visits, Support cases |
| Marriage and Family | ✅ | Seminars (counselling stays out of the app) |
| Mission | ✅ | Trips, Participants, Reports |
| Prayer Groups | ✅ | Groups, Prayer requests (admin and elder; members may submit their own through the API) |
| Spiritual Service | ✅ | Classes, Attendance, Candidates, Baptisms, Follow-ups (admin and elder) |
| Stage and Worship | ✅ | Services, Teams, Team members, Rehearsals, Equipment |
| Teaching | ✅ | Programs, Materials, Enrollments |
| Women | ✅ | Meetings (with minutes), Activities, Trainings |
| Workers' Aid | ✅ admin and elder only | Beneficiaries, Disbursements (record the month's payments in one go) |
| Youth | ✅ | Programs, Mentorship |

Every workspace is built from the same parts ([MINISTRY_WORKSPACES.md](MINISTRY_WORKSPACES.md)): add, edit and delete with confirmation, search and filters, cards instead of tables on a phone, and API routes whose roles follow the table's RLS. Each has an e2e spec covering its writes, the refusals for other roles and the phone layout. Not yet: leaders limited to their own ministry ([2.6](REMEDIATION_GUIDE.md#26-scope-ministry-leaders-to-their-own-ministry)), a member-facing prayer request form.

The 10 orphan pages (community, counseling, education, facilities, health, media, music, spiritual-service, worship, youth) and their API routes were deleted ([2.8](REMEDIATION_GUIDE.md#28-delete-the-dead-surface)).

## Cross-cutting

| Area | Status |
|---|---|
| Production build | ✅ passes; `npm audit` clean |
| Database reproducible from repo | ✅ dbmate migrations with up and down, round trip tested in CI; the live project needs adopting once ([1.1](REMEDIATION_GUIDE.md#11-make-the-schema-reproducible)) |
| English / Amharic | 🟡 infrastructure works; about 1% of the UI is translated ([3.4](REMEDIATION_GUIDE.md#34-amharic-for-real)) |
| Mobile | ✅ phone top bar with a menu drawer; lists become cards; e2e checks there's no sideways scroll at 360 and 390 px ([FE.1](REMEDIATION_GUIDE.md#fe1-responsive-app-shell)) |
| Look and feel | ✅ / 🟡 the church's brand from the member registry (lebu-form): church blue, the open-book logo (also the favicon), Karla and Noto Ethiopic; every page uses the theme colours. Light mode only for now ([Frontend & UI track](REMEDIATION_GUIDE.md#frontend--ui-track)) |
| Tests / CI | ✅ unit, migration, RLS and e2e tests on every PR; deploy job ready to configure ([3.6](REMEDIATION_GUIDE.md#36-tests-and-ci), [SETUP §7](SETUP.md#7-cicd)) |
| Keep-warm | ✅ every 10 minutes once the secrets are set ([SETUP §8](SETUP.md#8-keep-warm-ping)) |
| Backups / monitoring | ⬜ ([0.6](REMEDIATION_GUIDE.md#06-stop-the-project-from-silently-disappearing), [3.7](REMEDIATION_GUIDE.md#37-observability), [3.8](REMEDIATION_GUIDE.md#38-backups-and-disaster-recovery)) |

## PRD features not built yet

Two-factor auth; recurring events, RSVP and reminders; SMS, email and messaging delivery; budget approval workflow; online payments; member self-service (own profile, own giving history); PDF/Excel reports; Afan Oromo; multi-branch; offline use. See [PRD.md](PRD.md).

*Update this page whenever a remediation step lands.*
