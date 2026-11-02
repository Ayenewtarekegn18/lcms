import { collectionRoutes } from '@/lib/api/collection'
import { womenTraining } from '@/lib/api/schemas'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Women's Ministry trainings (women_trainings is member-readable under RLS; staff write).
//   GET ?search= (title, instructor) &limit=&offset=   POST { title, training_date?, instructor_name?, description?, registered_count? }
const list = collectionRoutes({
  table: 'women_trainings',
  roles: { read: ROLES, write: STAFF },
  create: womenTraining,
  search: { columns: ['title', 'instructor_name'] },
  order: { column: 'training_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
