import { itemRoutes } from '@/lib/api/crud'
import { baptism } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

const item = itemRoutes({ table: 'baptisms', roles: STAFF, update: baptism.partial() })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
