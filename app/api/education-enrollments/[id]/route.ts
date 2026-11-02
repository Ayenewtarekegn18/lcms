import { itemRoutes } from '@/lib/api/crud'
import { educationEnrollmentUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Change an enrollment's status, dates or grade, or remove it (staff only, like the RLS).
const item = itemRoutes({ table: 'education_enrollments', roles: STAFF, update: educationEnrollmentUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
