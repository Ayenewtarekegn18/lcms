import { itemRoutes } from '@/lib/api/crud'
import { womenActivity } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

const item = itemRoutes({ table: 'women_activities', roles: STAFF, update: womenActivity.partial() })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
