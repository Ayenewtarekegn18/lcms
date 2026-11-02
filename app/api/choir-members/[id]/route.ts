import { itemRoutes } from '@/lib/api/crud'
import { choirMemberUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Change a singer's voice part, join date or active flag, or remove them from the choir list.
const item = itemRoutes({ table: 'choir_members', roles: STAFF, update: choirMemberUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
