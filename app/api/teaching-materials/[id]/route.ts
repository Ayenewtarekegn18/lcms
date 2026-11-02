import { itemRoutes } from '@/lib/api/crud'
import { teachingMaterialUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a teaching material (staff, like the teaching_materials write policies).
const item = itemRoutes({ table: 'teaching_materials', roles: STAFF, update: teachingMaterialUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
