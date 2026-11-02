import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { prayerRequestCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { PRAYER_REQUEST_STATUSES } from '@/lib/ministries/prayer'
import { ROLES } from '@/lib/auth/roles'

// Prayer requests are confidential (RLS: prayer_requests_pastoral_all, admin and elder). RLS also lets
// every signed-in user submit a request of their own and read their own requests
// (prayer_requests_create_own, prayer_requests_own), so listing and adding are open to every role and
// the database decides which rows each person gets; changing and deleting stay pastoral ([id]/route.ts).
//   GET ?group_id= &status= &search= (request text) &limit=&offset=   POST { request_text, group_id?, status? }
const list = collectionRoutes({
  table: 'prayer_requests',
  roles: { read: ROLES, write: ROLES },
  create: prayerRequestCreate,
  select: '*, group:prayer_groups!group_id(id, name), requested_by:profiles!requested_by_id(id, first_name, last_name)',
  filters: { group_id: uuid, status: z.enum(PRAYER_REQUEST_STATUSES) },
  search: { columns: ['request_text'] },
  order: { column: 'created_at', ascending: false },
  owner: 'requested_by_id',
})
export const GET = list.GET
export const POST = list.POST
