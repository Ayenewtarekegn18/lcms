import { itemRoutes } from '@/lib/api/crud'
import { womenMeeting } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

const item = itemRoutes({ table: 'women_meetings', roles: STAFF, update: womenMeeting.partial(), touchUpdatedAt: true })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
