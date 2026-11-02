import { itemRoutes } from '@/lib/api/crud'
import { spiritualClassUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Deleting a class deletes its attendance list too (ON DELETE CASCADE).
const item = itemRoutes({ table: 'spiritual_classes', roles: STAFF, update: spiritualClassUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
