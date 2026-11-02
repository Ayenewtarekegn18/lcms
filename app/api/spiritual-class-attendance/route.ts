import { collectionRoutes } from '@/lib/api/collection'
import { spiritualClassAttendanceCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { STAFF } from '@/lib/auth/roles'

// The list of people at one spiritual class (spiritual_class_attendance is staff-only under RLS).
//   GET ?class_id= (required) &search= (name) &limit=&offset=   POST { class_id, member_id, attended? }
// One row per person and class: adding someone already on the list updates `attended`.
const list = collectionRoutes({
  table: 'spiritual_class_attendance',
  roles: { read: STAFF, write: STAFF },
  create: spiritualClassAttendanceCreate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name)',
  filters: { class_id: uuid },
  required: ['class_id'],
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  upsertOn: 'class_id,member_id',
  pageSize: 100,
})
export const GET = list.GET
export const POST = list.POST
