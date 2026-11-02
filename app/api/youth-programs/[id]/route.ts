import { itemRoutes } from '@/lib/api/crud'
import { youthProgramUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a youth program (staff, like the youth_programs write policies).
const item = itemRoutes({ table: 'youth_programs', roles: STAFF, update: youthProgramUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
