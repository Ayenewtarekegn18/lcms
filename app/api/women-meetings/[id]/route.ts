import { itemRoutes } from '@/lib/api/crud'
import { womenMeetingUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit a meeting (its details or minutes) or delete it; staff, like the women_meetings write policies.
const item = itemRoutes({ table: 'women_meetings', roles: STAFF, update: womenMeetingUpdate, touchUpdatedAt: true })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
