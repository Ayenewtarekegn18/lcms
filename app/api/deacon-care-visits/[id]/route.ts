import { itemRoutes } from '@/lib/api/crud'
import { deaconCareVisitUpdate } from '@/lib/api/schemas'
import { PASTORAL } from '@/lib/auth/roles'

// Correct a care visit's date or notes, or delete it (admin and elder, like the RLS).
const item = itemRoutes({ table: 'deacon_care_visits', roles: PASTORAL, update: deaconCareVisitUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
