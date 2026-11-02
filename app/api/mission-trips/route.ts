import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { missionTripCreate } from '@/lib/api/schemas'
import { MISSION_TRIP_STATUSES } from '@/lib/ministries/mission'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Mission trips: every signed-in user may read them, staff plan and change them (RLS: mission_trips is
// member-readable).   GET ?search= (title, location) &status= &limit=&offset=
//   POST { title, trip_date?, location?, description?, status? }
const list = collectionRoutes({
  table: 'mission_trips',
  roles: { read: ROLES, write: STAFF },
  create: missionTripCreate,
  filters: { status: z.enum(MISSION_TRIP_STATUSES) },
  search: { columns: ['title', 'location'] },
  order: [{ column: 'trip_date', ascending: false }, { column: 'title' }],
})
export const GET = list.GET
export const POST = list.POST
