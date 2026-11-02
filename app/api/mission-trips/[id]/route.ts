import { itemRoutes } from '@/lib/api/crud'
import { missionTripUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Change or delete a mission trip (its participants and reports go with it: ON DELETE CASCADE).
const item = itemRoutes({ table: 'mission_trips', roles: STAFF, update: missionTripUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
