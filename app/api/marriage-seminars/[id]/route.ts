import { itemRoutes } from '@/lib/api/crud'
import { marriageSeminarUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a seminar (staff, like the marriage_seminars write policies).
const item = itemRoutes({ table: 'marriage_seminars', roles: STAFF, update: marriageSeminarUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
