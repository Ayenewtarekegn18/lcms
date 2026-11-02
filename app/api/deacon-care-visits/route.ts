import { collectionRoutes } from '@/lib/api/collection'
import { deaconCareVisitCreate } from '@/lib/api/schemas'
import { PASTORAL } from '@/lib/auth/roles'

// Deacons' care visits are confidential (RLS: admin and elder read and write; a visitor also sees their own
// visits, but the routes stay with the group).   GET ?search= (member's name) &limit=&offset=
//   POST { member_id, visit_date, notes? }; visitor_id is the signed-in user.
const list = collectionRoutes({
  table: 'deacon_care_visits',
  roles: { read: PASTORAL, write: PASTORAL },
  create: deaconCareVisitCreate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name), visitor:profiles!visitor_id(id, first_name, last_name)',
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: { column: 'visit_date', ascending: false },
  owner: 'visitor_id',
})
export const GET = list.GET
export const POST = list.POST
