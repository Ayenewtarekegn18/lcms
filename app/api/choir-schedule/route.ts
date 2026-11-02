import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { choirScheduleCreate } from '@/lib/api/schemas'
import { CHOIR_SCHEDULE_TYPES } from '@/lib/ministries/choir'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Choir rehearsals and performances: every signed-in user may read them, staff plan them (RLS:
// choir_schedule is member-readable).   GET ?event_type= &search= (location, notes) &limit=&offset=
//   POST { event_date, event_type?, location?, notes? }
const list = collectionRoutes({
  table: 'choir_schedule',
  roles: { read: ROLES, write: STAFF },
  create: choirScheduleCreate,
  filters: { event_type: z.enum(CHOIR_SCHEDULE_TYPES) },
  search: { columns: ['location', 'notes'] },
  order: { column: 'event_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
