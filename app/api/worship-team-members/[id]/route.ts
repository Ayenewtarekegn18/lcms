import { itemRoutes } from '@/lib/api/crud'
import { worshipTeamMemberUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Change a team member's role, or take them off the team (staff only, like the RLS).
const item = itemRoutes({ table: 'worship_team_members', roles: STAFF, update: worshipTeamMemberUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
