import { itemRoutes } from '@/lib/api/crud'
import { womenTraining } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

const item = itemRoutes({ table: 'women_trainings', roles: STAFF, update: womenTraining.partial() })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
