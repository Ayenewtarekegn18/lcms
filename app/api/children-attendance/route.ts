import { collectionRoutes } from '@/lib/api/collection'
import { childrenAttendanceCreate } from '@/lib/api/schemas'
import { date, uuid } from '@/lib/api/validation'
import { STAFF } from '@/lib/auth/roles'

// The children's class register (children_attendance is staff-only under RLS). Always per class.
//   GET ?class_id= (required) &attendance_date= &member_id= &limit=&offset=  (newest day first)
//   POST { class_id, member_id, attendance_date, status? }: marking a child again on the same day
//   changes the mark ((class_id, member_id, attendance_date) is unique).
const list = collectionRoutes({
  table: 'children_attendance',
  roles: { read: STAFF, write: STAFF },
  create: childrenAttendanceCreate,
  select: '*, member:profiles!member_id(id, first_name, last_name)',
  filters: { class_id: uuid, attendance_date: date, member_id: uuid },
  required: ['class_id'],
  order: { column: 'attendance_date', ascending: false },
  upsertOn: 'class_id,member_id,attendance_date',
  pageSize: 500,
})
export const GET = list.GET
export const POST = list.POST
