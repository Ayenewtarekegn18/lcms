import { collectionRoutes } from '@/lib/api/collection'
import { youthMentorshipCreate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Youth mentoring pairs (youth_mentorship is staff-only under RLS); one mentor per young person.
//   GET ?search= (mentee's name) &limit=&offset=   POST { mentee_id, mentor_id, start_date?, notes?, is_active? }
const list = collectionRoutes({
  table: 'youth_mentorship',
  roles: { read: STAFF, write: STAFF },
  create: youthMentorshipCreate,
  select: '*, mentee:profiles!mentee_id!inner(id, first_name, last_name), mentor:profiles!mentor_id(id, first_name, last_name)',
  search: { columns: ['first_name', 'last_name'], referencedTable: 'mentee' },
  order: [{ column: 'is_active', ascending: false }, { column: 'start_date', ascending: false }],
})
export const GET = list.GET
export const POST = list.POST
