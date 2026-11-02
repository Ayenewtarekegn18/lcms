import { itemRoutes } from '@/lib/api/crud'
import { educationProgramUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a program; deleting it also deletes its materials and enrollments (ON DELETE CASCADE).
const item = itemRoutes({ table: 'education_programs', roles: STAFF, update: educationProgramUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
