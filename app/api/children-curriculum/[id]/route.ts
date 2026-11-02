import { itemRoutes } from '@/lib/api/crud'
import { childrenCurriculumUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a lesson (staff, like the children_curriculum write policies).
const item = itemRoutes({ table: 'children_curriculum', roles: STAFF, update: childrenCurriculumUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
