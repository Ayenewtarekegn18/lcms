import { itemRoutes } from '@/lib/api/crud'
import { worshipRehearsalUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a rehearsal (staff only, like the RLS).
const item = itemRoutes({ table: 'worship_rehearsals', roles: STAFF, update: worshipRehearsalUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
