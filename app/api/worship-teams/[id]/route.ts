import { itemRoutes } from '@/lib/api/crud'
import { worshipTeamUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Rename, describe or delete a worship team (its member list goes with it).
const item = itemRoutes({ table: 'worship_teams', roles: STAFF, update: worshipTeamUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
