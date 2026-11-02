import { itemRoutes } from '@/lib/api/crud'
import { spiritualClassAttendanceUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Mark someone present or absent, or take them off the class list (staff, like RLS).
const item = itemRoutes({ table: 'spiritual_class_attendance', roles: STAFF, update: spiritualClassAttendanceUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
