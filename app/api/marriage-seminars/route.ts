import { collectionRoutes } from '@/lib/api/collection'
import { marriageSeminarCreate } from '@/lib/api/schemas'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Marriage and family seminars (RLS: marriage_seminars is member-readable, staff write). Counseling
// (counseling_services) is confidential pastoral data and deliberately has no route here.
//   GET ?search= (title, location) &limit=&offset=   POST { title, seminar_date?, location?, facilitator_id? }
const list = collectionRoutes({
  table: 'marriage_seminars',
  roles: { read: ROLES, write: STAFF },
  create: marriageSeminarCreate,
  select: '*, facilitator:profiles!facilitator_id(id, first_name, last_name)',
  search: { columns: ['title', 'location'] },
  order: { column: 'seminar_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
