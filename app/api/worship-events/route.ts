import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { worshipEventCreate } from '@/lib/api/schemas'
import { WORSHIP_TYPE_VALUES } from '@/lib/ministries/stage-worship'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Worship services (RLS: worship_events is member-readable, staff write). event_date is a timestamptz
// holding the day of the service; it is read back as that day (YYYY-MM-DD) so the edit form gets a date.
//   GET ?worship_type= &search= (title, location) &limit=&offset=
//   POST { title, event_date, worship_leader_id?, worship_type?, description?, location?, songs_list?, notes? }
const list = collectionRoutes({
  table: 'worship_events',
  roles: { read: ROLES, write: STAFF },
  create: worshipEventCreate,
  select: 'id, title, event_date::date, worship_leader_id, worship_type, description, location, songs_list, notes, created_at, updated_at, leader:profiles!worship_leader_id(id, first_name, last_name)',
  filters: { worship_type: z.enum(WORSHIP_TYPE_VALUES) },
  search: { columns: ['title', 'location'] },
  order: { column: 'event_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
