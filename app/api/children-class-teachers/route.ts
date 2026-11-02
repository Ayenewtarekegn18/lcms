import { collectionRoutes } from '@/lib/api/collection'
import { childrenTeacherCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { STAFF } from '@/lib/auth/roles'

// Who teaches which children's class (children_class_teachers is staff-only under RLS).
//   GET ?class_id= &search= (teacher's name) &limit=&offset=   POST { class_id, member_id, role? }
const list = collectionRoutes({
  table: 'children_class_teachers',
  roles: { read: STAFF, write: STAFF },
  create: childrenTeacherCreate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name), class:children_classes!class_id(id, name)',
  filters: { class_id: uuid },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: { column: 'class_id' }, // a class's teachers stay together
})
export const GET = list.GET
export const POST = list.POST
