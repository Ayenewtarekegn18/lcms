# LKH-DMP Core System Modules – Completion Checklist

Per PRD Section 4, complete each module **100%** (backend + UI aligned to PRD) before moving to the next.

---

## Order of completion

1. **Members & Registration** (foundation for all ministries)
2. **Ministries** (list + add; hub from DB)
3. **Attendance** (record flow + link to events)
4. **Financial Management**
5. **Event & Calendar Management**
6. **Communications & Announcements**
7. **Document & Archive Management**
8. **Reporting & Analytics**
9. **Access Control & Security** (RBAC, audit logs)
10. **Ministry Modules (14)** – each with full backend and PRD features

---

## Module 1: Members & Registration

**PRD:** Member registration, profiles, ministry involvement, contribution history (view).

| Requirement | Status |
|-------------|--------|
| Register new members (form → DB) | ✅ (API POST /api/members with action: 'create') |
| Member list with search, view, edit, deactivate | ✅ |
| Profile fields aligned to registration steps | ✅ (core: first_name, last_name, DOB, gender, address/city/country) |
| (Later) Member view: profile, ministry involvement, contribution history | ⬜ |

**Definition of done:** Registration form submits to `profiles` via API; list/edit/deactivate already work. *Note:* If `profiles.id` references `auth.users(id)`, add a migration so member-only profiles can be created (e.g. `id DEFAULT gen_random_uuid()` and drop FK), or create auth users for each member.

---

## Module 2: Ministries

**PRD:** Configure ministry structure; ministry list and management.

| Requirement | Status |
|-------------|--------|
| List active ministries from DB | ✅ |
| Add new ministry (form → DB) | ✅ (modal → POST /api/ministries) |
| Edit / deactivate ministry | ⬜ (can add later) |
| Ministry hub page loads ministries from DB | ✅ (hub shows DB count + link to Manage) |

**Definition of done:** Add ministry works; hub shows configured count from DB. ✅

---

## Module 3: Attendance

**PRD:** Track attendance for classes, meetings, events.

| Requirement | Status |
|-------------|--------|
| List attendance records from DB | ✅ |
| Record attendance (member + event/date + status) | ✅ (modal → POST /api/attendance) |
| Filter by member, event, date range | ⬜ (API supports params; UI filter can be added later) |

**Definition of done:** "Record Attendance" opens modal; saves to `attendance` table; list refreshes. ✅

---

## Module 4: Financial Management

**PRD:** Contributions (tithes, offerings, pledges, donations); expenses by category; dashboards; reports; (later) payment integration.

| Requirement | Status |
|-------------|--------|
| Record income and expenses | ✅ |
| Categories (tithes, offerings, ministry, maintenance, etc.) | ✅ (dropdown: income + expense categories) |
| Real-time summary (income, expense, balance) | ✅ |
| By-category view (income + expense breakdown) | ✅ (real data in tabs) |
| Export for audits (CSV) | ✅ (Export CSV button) |
| (Phase 3) Payment integration | Future |

**Definition of done:** Categories in use; dashboard accurate; export to CSV. ✅

---

## Module 5: Event & Calendar Management

**PRD:** Create events (recurring/one-time); track attendance per event; calendar sync; (later) notifications and member registration.

| Requirement | Status |
|-------------|--------|
| CRUD events | ✅ |
| Dashboard "Upcoming Events" count correct | ✅ (uses event_date) |
| Calendar page shows events from DB | ✅ (loads from Supabase events) |
| Attendance per event (link event ↔ attendance) | ✅ (Record Attendance has optional event) |
| (Later) Notifications, member event registration | Future |

**Definition of done:** Calendar loads from `events`; attendance can be recorded per event. ✅

---

## Module 6: Communications & Announcements

**PRD:** Bulletin; SMS/email; WhatsApp/Telegram; templates.

| Requirement | Status |
|-------------|--------|
| Create and list announcements (persisted) | ✅ (POST/GET /api/announcements, table announcements) |
| Message templates (stored) | ✅ (GET /api/templates, table message_templates; Use Template fills compose) |
| (Later) SMS/email/WhatsApp delivery | Future |

**Definition of done:** Announcements and templates in DB; UI list/compose/publish and templates from API. Run `scripts/011_announcements_and_templates.sql` if tables don't exist. ✅

---

## Module 7: Document & Archive Management

**PRD:** Upload, categorize, search, tag; backup/restore; access control.

| Requirement | Status |
|-------------|--------|
| Upload documents (Supabase Storage + metadata in DB) | ✅ (POST /api/documents, bucket documents) |
| List, search, filter by category | ✅ (GET /api/documents, category + search) |
| Download via signed URL | ✅ (GET /api/documents?id=) |
| (Later) Backup/restore, RBAC on docs | Future |

**Definition of done:** Upload to storage; metadata in documents table; list/search/filter; download. Create bucket `documents` in Supabase Dashboard and run `scripts/012_documents.sql`. ✅

---

## Module 8: Reporting & Analytics

**PRD:** Attendance trends; financial summaries; ministry dashboards; member growth; export PDF/Excel/CSV.

| Requirement | Status |
|-------------|--------|
| Reports from real data (members, attendance, financial) | ✅ (Supabase: profiles, ministries, events, financial_transactions, attendance) |
| Key metrics (members, attendance, financial, ministries) | ✅ |
| Export to CSV | ✅ (Export CSV button) |

**Definition of done:** Real data; export CSV. ✅

---

## Module 9: Access Control & Security

**PRD:** RBAC; secure auth; activity logs; encryption; backups.

| Requirement | Status |
|-------------|--------|
| Role-based access (roles + permissions) | ✅ (profiles.role; sidebar filtered by role; GET audit-log admin/elder only) |
| Activity/audit logs for critical actions | ✅ (audit_log table; POST/GET /api/audit-log; logAudit in members, financial, events, attendance, ministries; Audit Log page with filter) |
| (Existing) Auth (password, redirect) | ✅ |
| (Later) 2FA, backup/restore UI | Future |

**Definition of done:** Roles enforced in UI/API; critical actions logged. ✅

---

## Module 10: Ministry Modules (14)

Each ministry: **backend tables/APIs + UI using real data**, no mock.

| # | Ministry | PRD features | Backend | UI from DB |
|---|----------|--------------|---------|------------|
| 1 | Spiritual Service | Candidates, classes, baptisms, follow-up | ✅ (015 + APIs) | ✅ Full (search, add, edit, delete all tabs) |
| 2 | Teaching & Seminar | Courses, participants, materials | ✅ (education_programs + teaching_materials; 015) | ⬜ Page still mock; APIs exist |
| 3 | Women's | Registry, meetings, trainings, minutes | ✅ (women_* + ministry_members APIs) | ✅ Full (members, meetings, activities, trainings from DB) |
| 4 | Youth | Registry, events, mentorship | ✅ (youth_programs 003 + youth_mentorship 015) | ⬜ Page needs wiring |
| 5 | Children | Classes, attendance, teachers, curriculum | ✅ (015 + children-classes API) | ⬜ Page needs wiring |
| 6 | Mission | Trips, participants, reports | ✅ (015 + mission-trips API) | ⬜ Page needs wiring |
| 7 | Marriage & Family | Premarital, counseling, seminars | ✅ (015 marriage_seminars; counseling_services 003) | ⬜ Page needs wiring |
| 8 | Prayer Groups | Groups, schedules, requests | ✅ (015 + prayer-groups, prayer-requests APIs) | ⬜ Page needs wiring |
| 9 | Administration | Meetings, documents, tasks, announcements | ✅ (015 admin_tasks + API) | ⬜ Page needs wiring |
| 10 | Deacons | Care visits, support cases | ✅ (015 + deacon-care-visits API) | ⬜ Page needs wiring |
| 11 | Charity | Aid requests, review, distribution, audit | ✅ (015 + charity-aid-requests API) | ⬜ Page needs wiring |
| 12 | Stage & Worship | Services, teams, equipment, rehearsals | ✅ (015 + worship_events 003) | ⬜ Page needs wiring |
| 13 | Neftalem Choir | Members, schedule, song library | ✅ (015 + choir-members, choir-songs APIs) | ⬜ Page needs wiring |
| 14 | Monthly Workers Aid | Beneficiaries, disbursements, reporting | ✅ (015 + workers-aid-beneficiaries API) | ⬜ Page needs wiring |

**Done:** Migration `scripts/015_ministry_modules_prd.sql`; APIs for spiritual-service, women (meetings/activities/trainings), ministry-members, baptisms, mission-trips, children-classes, prayer-groups, prayer-requests, charity-aid-requests, deacon-care-visits, workers-aid-beneficiaries, choir-members, choir-songs, admin-tasks. Ministry hub loads real member counts from DB. **Next:** Run 015 in Supabase; wire remaining ministry pages (Teaching, Youth, Children, Mission, etc.) to their APIs with search/add/edit/delete.

---

## Progress summary

- **Modules 1–8:** ✅ Done (Members, Ministries, Attendance, Financial, Calendar/Events, Communications, Documents, Reports).
- **Module 9 (Access Control & Security):** ✅ Done (roles, audit log table/API/page, role-based sidebar).
- **Module 10:** All 14 ministry modules pending backend + UI.
