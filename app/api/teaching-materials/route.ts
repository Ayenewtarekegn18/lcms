import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { teachingMaterialCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { MATERIAL_TYPE_VALUES } from '@/lib/ministries/teaching'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Material for a program: documents, recordings, links (RLS: teaching_materials is member-readable, staff write).
//   GET ?program_id= &material_type= &search= (title) &limit=&offset=   POST { program_id, title, material_type?, url? }
const list = collectionRoutes({
  table: 'teaching_materials',
  roles: { read: ROLES, write: STAFF },
  create: teachingMaterialCreate,
  select: '*, program:education_programs!program_id(id, title)',
  filters: { program_id: uuid, material_type: z.enum(MATERIAL_TYPE_VALUES) },
  search: { columns: ['title'] },
  order: { column: 'title' },
})
export const GET = list.GET
export const POST = list.POST
