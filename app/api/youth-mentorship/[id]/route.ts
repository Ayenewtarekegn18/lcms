import { itemRoutes } from '@/lib/api/crud'
import { youthMentorshipUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Change a mentoring pair's start date, notes or active flag, or end it (staff only, like RLS).
const item = itemRoutes({ table: 'youth_mentorship', roles: STAFF, update: youthMentorshipUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
