import { itemRoutes } from '@/lib/api/crud'
import { missionParticipantUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Change a participant's role on a trip, or take them off it.
const item = itemRoutes({ table: 'mission_trip_participants', roles: STAFF, update: missionParticipantUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
