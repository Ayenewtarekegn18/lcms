import { collectionRoutes } from '@/lib/api/collection'
import { womenMeeting } from '@/lib/api/schemas'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Women's Ministry meetings and their minutes (women_meetings is member-readable under RLS; staff write).
//   GET ?search= (title, location) &limit=&offset=   POST { title, meeting_date, meeting_time?, location?, attendees_count?, minutes_text? }
const list = collectionRoutes({
  table: 'women_meetings',
  roles: { read: ROLES, write: STAFF },
  create: womenMeeting,
  search: { columns: ['title', 'location'] },
  order: [{ column: 'meeting_date', ascending: false }, { column: 'meeting_time', ascending: false }],
})
export const GET = list.GET
export const POST = list.POST
