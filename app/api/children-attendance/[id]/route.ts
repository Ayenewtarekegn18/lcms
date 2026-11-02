import { itemRoutes } from '@/lib/api/crud'
import { childrenAttendanceUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Change a child's mark (present / absent) or clear it (staff only, like RLS).
const item = itemRoutes({ table: 'children_attendance', roles: STAFF, update: childrenAttendanceUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
