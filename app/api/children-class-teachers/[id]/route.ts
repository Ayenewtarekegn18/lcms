import { itemRoutes } from '@/lib/api/crud'
import { childrenTeacherUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Move a teacher to another class, change their role, or take them off the class (staff only, like RLS).
const item = itemRoutes({ table: 'children_class_teachers', roles: STAFF, update: childrenTeacherUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
