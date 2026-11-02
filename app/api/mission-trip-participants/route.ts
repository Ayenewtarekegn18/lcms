import { collectionRoutes } from '@/lib/api/collection'
import { missionParticipantCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { STAFF } from '@/lib/auth/roles'

// Who goes on each mission trip (mission_trip_participants is staff-only under RLS).
//   GET ?trip_id= &search= (participant's name) &limit=&offset=   POST { trip_id, member_id, role? }
const list = collectionRoutes({
  table: 'mission_trip_participants',
  roles: { read: STAFF, write: STAFF },
  create: missionParticipantCreate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name), trip:mission_trips!trip_id(id, title, trip_date)',
  filters: { trip_id: uuid },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: { column: 'trip_id' },
})
export const GET = list.GET
export const POST = list.POST
