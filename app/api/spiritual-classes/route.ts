import { collectionRoutes } from '@/lib/api/collection'
import { spiritualClass } from '@/lib/api/schemas'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Salvation and baptism preparation classes (spiritual_classes is member-readable under RLS; staff write).
//   GET ?search= (title, location) &limit=&offset=   POST { title, class_date, instructor_id?, location?, max_attendees? }
const list = collectionRoutes({
  table: 'spiritual_classes',
  roles: { read: ROLES, write: STAFF },
  create: spiritualClass,
  select: '*, instructor:profiles!instructor_id(id, first_name, last_name)',
  search: { columns: ['title', 'location'] },
  order: { column: 'class_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
