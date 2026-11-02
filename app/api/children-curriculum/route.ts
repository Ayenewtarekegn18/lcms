import { collectionRoutes } from '@/lib/api/collection'
import { childrenCurriculumCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Lessons and materials for the children's classes: every signed-in user may read them, staff add and
// change them (RLS: children_curriculum is member-readable).
//   GET ?class_id= &search= (title, description) &limit=&offset=   POST { title, class_id?, description?, url? }
const list = collectionRoutes({
  table: 'children_curriculum',
  roles: { read: ROLES, write: STAFF },
  create: childrenCurriculumCreate,
  select: '*, class:children_classes!class_id(id, name)',
  filters: { class_id: uuid },
  search: { columns: ['title', 'description'] },
  order: { column: 'created_at', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
