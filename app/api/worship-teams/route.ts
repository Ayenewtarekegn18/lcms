import { collectionRoutes } from '@/lib/api/collection'
import { worshipTeamCreate } from '@/lib/api/schemas'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Worship teams (RLS: worship_teams is member-readable, staff write).
//   GET ?search= (name, description) &limit=&offset=   POST { name, description? }
const list = collectionRoutes({
  table: 'worship_teams',
  roles: { read: ROLES, write: STAFF },
  create: worshipTeamCreate,
  // How many people serve on each team (worship_team_members is staff only: 0 for anyone else).
  select: '*, members:worship_team_members(count)',
  search: { columns: ['name', 'description'] },
  order: { column: 'name' },
})
export const GET = list.GET
export const POST = list.POST
