import { collectionRoutes } from '@/lib/api/collection'
import { childrenClassCreate } from '@/lib/api/schemas'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Children's Ministry classes: every signed-in user may read them, staff run them (RLS:
// children_classes is member-readable).   GET ?search= (name, age group, place) &limit=&offset=
//   POST { name, age_group?, schedule_text?, location? }
const list = collectionRoutes({
  table: 'children_classes',
  roles: { read: ROLES, write: STAFF },
  create: childrenClassCreate,
  search: { columns: ['name', 'age_group', 'location'] },
  order: { column: 'name' },
})
export const GET = list.GET
export const POST = list.POST
