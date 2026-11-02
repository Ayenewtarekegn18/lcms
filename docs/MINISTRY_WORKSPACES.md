# Ministry workspaces

Each of the 14 ministries has a page under `app/dashboard/ministry/<slug>`. A converted page is a
`MinistryWorkspace`: a header (English and Amharic name, meeting time, place), three figures (members,
leaders, upcoming events) and tabs. **Overview**, **Members** and **Events** come for free; a ministry adds
its own tabs, usually as config only. Neftalem Choir (`app/dashboard/ministry/choir/page.tsx`) is the
reference: copy it.

## Converting a ministry in ~30 lines

1. **API routes** for each table the ministry uses (most tables already exist in `lib/database.types.ts`).
   Add the strict schemas to `lib/api/schemas.ts` (create + `.partial()` update; optional fields with `opt()`),
   then two tiny route files:

   ```ts
   // app/api/admin-tasks/route.ts
   const list = collectionRoutes({
     table: 'admin_tasks',
     roles: { read: STAFF, write: STAFF },            // match the table's RLS group (below)
     create: adminTaskCreate,
     select: '*, assignee:profiles!assigned_to_id(id, first_name, last_name)',
     filters: { status: z.enum(['open', 'done']) },   // allowed ?column=value filters
     search: { columns: ['title', 'notes'] },          // ?search=
     order: { column: 'due_date' },
     // owner: 'created_by_id'   column set to the signed-in user on POST
     // scope rows to one ministry: filters: { ministry_id: uuid }, required: ['ministry_id']
   })
   export const GET = list.GET
   export const POST = list.POST

   // app/api/admin-tasks/[id]/route.ts
   const item = itemRoutes({ table: 'admin_tasks', roles: STAFF, update: adminTaskUpdate })
   export const PATCH = item.PATCH
   export const DELETE = item.DELETE
   ```

2. **The page**: one `defineResourceTab` per table, then the workspace.

   ```tsx
   'use client'
   type Task = Tables<'admin_tasks'>

   const tasks = defineResourceTab<Task>({
     key: 'tasks', label: 'Tasks', icon: ClipboardList,
     api: '/api/admin-tasks',
     noun: 'task',                              // "Add task", "Task added", "Delete this task?"
     describe: (t) => t.title,                  // the row's name in buttons and confirmations
     searchPlaceholder: 'Search tasks',         // only if the route has `search`
     // scope: 'ministry',                      // table has ministry_id: list ?ministry_id=…, send it on add
     // write: PASTORAL,                        // who sees add/edit/delete (default STAFF)
     columns: [
       { key: 'title', header: 'Task', primary: true },            // primary = card title on phones
       { key: 'due_date', header: 'Due', cell: (t) => formatDate(t.due_date) ?? '—' },
       { key: 'status', header: 'Status', cell: (t) => <Badge variant="secondary">{t.status}</Badge> },
     ],
     fields: [
       { name: 'title', label: 'Title', type: 'text', required: true },
       { name: 'assigned_to_id', label: 'Assigned to', type: 'member' },
       { name: 'due_date', label: 'Due', type: 'date', width: 'half' },
       { name: 'status', label: 'Status', type: 'select', options: ['open', 'done'], defaultValue: 'open', width: 'half' },
       { name: 'notes', label: 'Notes', type: 'textarea' },
     ],
   })

   export default function AdministrationPage() {
     return <MinistryWorkspace slug="administration" tabs={[tasks]} />
   }
   ```

   Anything a list + form can't do is a custom tab: `{ key, label, icon, render: (ctx) => <MyTab ctx={ctx} /> }`.
   `ctx` holds `ministry`, `data` (counts, leaders), `role`, `refresh()` (reload the header) and `openTab(key)`.

3. **An e2e spec** like `e2e/tests/ministry-choir.spec.ts`: add, edit, delete with confirmation as admin; the
   write APIs answer 403 for a member; the page fits a 390px screen.

## Building blocks

| What | Where | Notes |
|---|---|---|
| `collectionRoutes` | `lib/api/collection.ts` | GET (page, filters, search, `X-Total-Count`) + POST (role, strict body, owner, defaults, `upsertOn`) |
| `itemRoutes` | `lib/api/crud.ts` | PATCH + DELETE for `/[id]` (`softDelete` sets `is_active = false`) |
| Field config | `lib/forms/fields.ts` | `text textarea number date time url select member checkbox`; `required`, `options`, `createOnly`, `defaultValue`, `width: 'half'`, `help`. Empty inputs are left out when adding (column defaults apply) and sent as `null` when editing |
| UI kit | `components/app` (`import { … } from '@/components/app'`) | `Page`, `PageHeader`, `StatCard`, `EmptyState`, `ConfirmDialog`, `DataTable` (table ≥ md, cards below), `EntityFormDialog` (react-hook-form + zod, API field errors, toasts), `MemberPicker`, `RowActions`, `useApiList`, `useApiMutation` |
| Workspace | `components/ministry/workspace` | `MinistryWorkspace`, `defineResourceTab`, `ResourceTab`, built-in tabs, `ministry-icons.ts` |
| Ministry APIs | `app/api/ministries/by-slug/[slug]`, `app/api/ministries/workspaces`, `app/api/ministry-members`, `app/api/events?ministry_id=` | |

Use the theme tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`), not
`slate-*`, so a theme can restyle the pages.

## Roles

The database (RLS, `db/migrations/20261019000002_rls_rewrite.sql`) is the authority; route roles and the
tab's `write` must match it, or users see buttons that fail.

| RLS group | Read | Write | Tables (examples) |
|---|---|---|---|
| member-readable | `ROLES` (any signed-in user) | `STAFF` | ministries, events, choir_songs, choir_schedule, children_classes, women_*, mission_trips, prayer_groups, teaching_materials, youth_programs, spiritual_classes, marriage_seminars, worship_teams |
| staff only | `STAFF` | `STAFF` | ministry_members, choir_members, admin_tasks, children_attendance, children_class_teachers, spiritual_candidates, baptisms, youth_mentorship, mission_trip_participants, mission_reports, worship_team_members, worship_rehearsals |
| confidential | `PASTORAL` (admin, elder) | `PASTORAL` | deacon_care_visits, deacon_support_cases, charity_aid_requests, charity_distributions, workers_aid_beneficiaries, workers_aid_disbursements, spiritual_follow_ups, counseling_services, prayer_requests |

The ministry pages themselves are open to `STAFF` (`PAGE_ACCESS.ministry`, checked in the layout). On a
confidential tab set `write: PASTORAL` and use `PASTORAL` for both route roles: a ministry leader then sees
the tab's empty list (RLS hides the rows) without add buttons. Check the table's group in the migration
before choosing; never widen a route beyond its RLS.

## Checklist

- [ ] Strict create/update schemas in `lib/api/schemas.ts`; server-owned columns (`created_by_id`, `recorded_by_id`, …) come from `owner` or column defaults, never from the body
- [ ] Route roles and the tab's `write` match the table's RLS group
- [ ] Constants used by both the page and the schemas live in a client-safe module (like `lib/ministries/choir.ts`), not in `lib/api/schemas.ts` (it imports server code)
- [ ] Page uses `<MinistryWorkspace slug="…">`; no `MOCK_` data or invented numbers left
- [ ] Each column has a sensible phone card (`primary` on the name; `hideOnMobile` for wide extras)
- [ ] e2e spec: add / edit / delete with confirmation, 403 for a member, no horizontal scroll at 390px; unique names per run
- [ ] `npx tsc --noEmit`, `npx eslint <changed files>`, `npx vitest run` and the spec pass
