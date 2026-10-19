import { itemRoutes } from '@/lib/api/crud'
import { spiritualClass } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

const item = itemRoutes({ table: 'spiritual_classes', roles: STAFF, update: spiritualClass.partial() })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
