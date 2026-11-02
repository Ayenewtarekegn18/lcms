import { itemRoutes } from '@/lib/api/crud'
import { worshipEquipmentUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete an equipment item (staff only, like the RLS).
const item = itemRoutes({ table: 'worship_equipment', roles: STAFF, update: worshipEquipmentUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
