import { itemRoutes } from '@/lib/api/crud'
import { choirScheduleUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a rehearsal or performance (staff, like the choir_schedule write policies).
const item = itemRoutes({ table: 'choir_schedule', roles: STAFF, update: choirScheduleUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
