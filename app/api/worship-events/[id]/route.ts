import { itemRoutes } from '@/lib/api/crud'
import { worshipEventUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a worship service (rehearsals planned for it stay, without the link).
const item = itemRoutes({ table: 'worship_events', roles: STAFF, update: worshipEventUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
