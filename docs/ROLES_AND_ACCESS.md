# Roles and Access

## Roles

`profiles.role` is the single source of truth. It's one of:

| Role | Who |
|---|---|
| `admin` | Church administrators / IT. Full access, manages roles |
| `elder` | Elders and pastors. Full read access, pastoral care, audit log |
| `ministry_leader` | Leaders of a ministry. Members directory, events, communications, documents, ministry pages |
| `finance` | Treasurer / finance team. Ledger and financial reports |
| `member` | Everyone else with a login. Own profile, calendar, own giving |

`profiles.is_admin` is a legacy flag. After `docs/remediation/sql/01_emergency_lockdown.sql` it's derived automatically (`is_admin = role = 'admin'`); don't set it by hand.

## Page access (intended)

| Page | admin | elder | ministry_leader | finance | member |
|---|:-:|:-:|:-:|:-:|:-:|
| Dashboard, Calendar, Settings | ✔ | ✔ | ✔ | ✔ | ✔ |
| Members | ✔ | ✔ | ✔ | | |
| Financial | ✔ | ✔ (read-only) | | ✔ | |
| Communications, Documents | ✔ | ✔ | ✔ | | |
| Reports | ✔ | ✔ | ✔ | ✔ | |
| Ministries | ✔ | ✔ | ✔ | | |
| Audit Log | ✔ | ✔ | | | |

## Data access (enforced by RLS after remediation 01 + 02)

| Data | Read | Write |
|---|---|---|
| Own profile | self | self, except `role` / `is_active` (admin only) |
| Member directory (`profiles`) | admin, elder, ministry_leader, finance (finance needs names to attribute giving; no Members page) | admin |
| Financial ledger | admin, elder, finance; members see their own giving | admin, finance (delete: admin) |
| Pastoral care (counselling, deacon visits and cases, prayer requests, follow-ups, charity and workers' aid) | admin, elder, plus the assigned counsellor or deacon | admin, elder |
| Rosters, attendance, children, baptisms, documents | admin, elder, ministry_leader | same |
| Events, ministries, announcements, schedules | every active signed-in user | admin, elder, ministry_leader |
| Audit log | admin, elder | database triggers only |

Deactivated users (`is_active = false`) lose all role-based access.

## How it's enforced

| Layer | Mechanism | State |
|---|---|---|
| Database (authoritative) | RLS policies using `public.has_role(...)` | Written and tested: [`01`](remediation/sql/01_emergency_lockdown.sql), [`02`](remediation/sql/02_rls_rewrite.sql). **Must be applied to each project** |
| Pages | Server layouts calling `requirePageRole(...)` | Remediation Step 1.2 |
| API routes | `requireRole(...)` + zod | Remediation Step 1.4 |
| Sidebar | Hides links by role (`components/sidebar.tsx`) | Convenience only; it doesn't protect anything |

> **Until the remediation is applied:** the dashboard layout reads only `is_admin`, so `elder`, `ministry_leader` and `finance` users see the 3-item member menu, and anyone can open restricted pages by URL. See [ARCHITECTURE_REVIEW.md §5.3](ARCHITECTURE_REVIEW.md#53-authorisation-layers-intended-vs-actual).

Planned refinement ([Remediation 2.6](REMEDIATION_GUIDE.md#26-scope-ministry-leaders-to-their-own-ministry)): a `ministry_leader` edits only the ministries they lead.

## Granting a role

Only an admin, or someone using the SQL editor, can change roles. Users can't change their own (enforced by a trigger).

```sql
UPDATE public.profiles
   SET role = 'finance'          -- admin | elder | ministry_leader | finance | member
 WHERE id = (SELECT id FROM auth.users WHERE email = 'person@example.com');
```

The user must sign out and back in for the sidebar to update.
