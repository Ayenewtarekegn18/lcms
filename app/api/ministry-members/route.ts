import { collectionRoutes } from '@/lib/api/collection'
import { ministryMembershipCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { STAFF } from '@/lib/auth/roles'

// A ministry's members (ministry_members is staff-only under RLS).
//   GET ?ministry_id= (required) &search= (member's name) &limit=&offset=  → active members with their
//       names, newest first; the total is in X-Total-Count
//   POST { ministry_id, member_id, role? = 'member' } → adds the person, or reactivates a removed
//       membership (and sets its role)
// Change the role or remove (deactivate): /api/ministry-members/[id].
const list = collectionRoutes({
  table: 'ministry_members',
  roles: { read: STAFF, write: STAFF },
  create: ministryMembershipCreate,
  // !inner: the name search below filters the memberships, not just the embedded profile
  select: '*, member:profiles!member_id!inner(id, first_name, last_name, email, phone)',
  filters: { ministry_id: uuid },
  required: ['ministry_id'],
  where: { is_active: true },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: { column: 'joined_date', ascending: false },
  defaults: { is_active: true },
  upsertOn: 'ministry_id,member_id',
  pageSize: 500,
})
export const GET = list.GET
export const POST = list.POST
