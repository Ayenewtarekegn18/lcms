import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { educationProgramCreate } from '@/lib/api/schemas'
import { PROGRAM_TYPE_VALUES } from '@/lib/ministries/teaching'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Teaching programs: courses, seminars, workshops (RLS: education_programs is member-readable, staff write).
//   GET ?program_type= &search= (title, description, location) &limit=&offset=
//   POST { title, start_date, description?, instructor_id?, end_date?, duration_weeks?, location?, max_capacity?, program_type?, is_active? }
const list = collectionRoutes({
  table: 'education_programs',
  roles: { read: ROLES, write: STAFF },
  create: educationProgramCreate,
  // Enrollment counts come from a staff-only table: 0 for anyone else.
  select: '*, instructor:profiles!instructor_id(id, first_name, last_name), enrollments:education_enrollments(count)',
  filters: { program_type: z.enum(PROGRAM_TYPE_VALUES) },
  search: { columns: ['title', 'description', 'location'] },
  order: { column: 'start_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
