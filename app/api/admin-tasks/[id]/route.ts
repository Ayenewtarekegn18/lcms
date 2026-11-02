import { itemRoutes } from '@/lib/api/crud'
import { adminTaskUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete an administration task (staff, like the admin_tasks policy).
const item = itemRoutes({ table: 'admin_tasks', roles: STAFF, update: adminTaskUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
