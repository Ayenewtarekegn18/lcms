import { itemRoutes } from '@/lib/api/crud'
import { prayerGroupUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Change or delete a prayer group (its requests stay, without a group: ON DELETE SET NULL).
const item = itemRoutes({ table: 'prayer_groups', roles: STAFF, update: prayerGroupUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
