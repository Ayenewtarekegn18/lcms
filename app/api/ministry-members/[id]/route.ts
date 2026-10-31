import { itemRoutes } from '@/lib/api/crud'
import { ministryMembershipUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Change a member's role in the ministry, or remove them. DELETE deactivates the membership (keeps
// history); adding the person again reactivates it (POST /api/ministry-members).
const item = itemRoutes({ table: 'ministry_members', roles: STAFF, update: ministryMembershipUpdate, softDelete: true })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
