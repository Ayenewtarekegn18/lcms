import { itemRoutes } from '@/lib/api/crud'
import { womenTrainingUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

const item = itemRoutes({ table: 'women_trainings', roles: STAFF, update: womenTrainingUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
