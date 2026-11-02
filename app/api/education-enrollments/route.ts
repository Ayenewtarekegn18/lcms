import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { educationEnrollmentCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { ENROLLMENT_STATUS_VALUES } from '@/lib/ministries/teaching'
import { STAFF } from '@/lib/auth/roles'

// Who is enrolled in which program and how far they got (RLS: education_enrollments is staff only).
//   GET ?program_id= &status= &search= (member's name) &limit=&offset=
//   POST { program_id, member_id, enrollment_date?, status?, completion_date?, grade? }
const list = collectionRoutes({
  table: 'education_enrollments',
  roles: { read: STAFF, write: STAFF },
  create: educationEnrollmentCreate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name), program:education_programs!program_id(id, title)',
  filters: { program_id: uuid, status: z.enum(ENROLLMENT_STATUS_VALUES) },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: { column: 'enrollment_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
