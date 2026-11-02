import { collectionRoutes } from '@/lib/api/collection'
import { worshipTeamMemberCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { STAFF } from '@/lib/auth/roles'

// Who serves on which worship team, and as what (RLS: worship_team_members is staff only).
//   GET ?team_id= &search= (member's name) &limit=&offset=   POST { team_id, member_id, role? }
const list = collectionRoutes({
  table: 'worship_team_members',
  roles: { read: STAFF, write: STAFF },
  create: worshipTeamMemberCreate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name), team:worship_teams!team_id(id, name)',
  filters: { team_id: uuid },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: [{ column: 'team_id' }, { column: 'role' }],
})
export const GET = list.GET
export const POST = list.POST
