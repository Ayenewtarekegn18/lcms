# Roles and Sidebar Access

## Why am I seeing only 3 items in the sidebar?

You see **Dashboard**, **Calendar**, and **Settings** only when your user is treated as a **member**.  
Admins and elders see **all** items (Dashboard, Members, Calendar, Financial, Communications, Documents, Reports, Audit Log, Settings, Ministries).

So if you expect to be an admin but only see 3 items, your **profile in the database** likely has:

- `role = 'member'` (or null, which defaults to member), and  
- `is_admin = false`

The app decides “full access” from: `is_admin === true` **or** `role === 'admin'` **or** `role === 'elder'`.

---

## How to give a user full access (admin)

In **Supabase** (Table Editor → `profiles`), find the row for your user (same `id` as in Authentication) and set:

- **role** = `admin`  
- **is_admin** = `true` (optional but recommended)

Or run in the SQL Editor:

```sql
-- Replace 'your@email.com' with the user's email
UPDATE public.profiles
SET role = 'admin', is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
);
```

Then log out and log back in so the layout can reload your profile.

---

## Role summary

| Role            | Sidebar access |
|-----------------|----------------|
| **admin**       | Full: Dashboard, Members, Calendar, Financial, Communications, Documents, Reports, Audit Log, Settings, Ministries. |
| **elder**       | Same as admin (full access). |
| **ministry_leader** | Dashboard, Members, Calendar, Communications, Documents, Reports, Settings, Ministries (no Audit Log, no Financial). |
| **finance**     | Dashboard, Financial, Reports, Settings. |
| **member**      | Dashboard, Calendar, Settings only (3 items). |

API routes may enforce additional checks (e.g. Audit Log and some financial actions are restricted to admin/elder or finance).
