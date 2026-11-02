import { collectionRoutes } from '@/lib/api/collection'
import { missionReportCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { STAFF } from '@/lib/auth/roles'

// Reports written after mission trips (mission_reports is staff-only under RLS). The author is the
// signed-in user.   GET ?trip_id= &search= (report text) &limit=&offset=   POST { trip_id, report_text, report_date? }
const list = collectionRoutes({
  table: 'mission_reports',
  roles: { read: STAFF, write: STAFF },
  create: missionReportCreate,
  select: '*, trip:mission_trips!trip_id(id, title, trip_date), author:profiles!created_by_id(id, first_name, last_name)',
  filters: { trip_id: uuid },
  search: { columns: ['report_text'] },
  order: [{ column: 'report_date', ascending: false }, { column: 'created_at', ascending: false }],
  owner: 'created_by_id',
})
export const GET = list.GET
export const POST = list.POST
