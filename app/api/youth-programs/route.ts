import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { youthProgramCreate } from '@/lib/api/schemas'
import { YOUTH_PROGRAM_TYPES } from '@/lib/ministries/youth'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Youth programs: every signed-in user may read them, staff plan them (RLS: youth_programs is
// member-readable). program_date is a timestamp column; it is read back as a plain day (YYYY-MM-DD),
// the way the form sends it. participants_count is not set here.
//   GET ?program_type= &search= (name, place, description) &limit=&offset=  (latest first)
//   POST { name, program_date, description?, age_range?, location?, leader_id?, max_participants?, program_type?, is_active? }
const list = collectionRoutes({
  table: 'youth_programs',
  roles: { read: ROLES, write: STAFF },
  create: youthProgramCreate,
  select:
    'id, name, description, age_range, program_date:program_date::date, location, leader_id, max_participants, participants_count, program_type, is_active, created_at, updated_at, leader:profiles!leader_id(id, first_name, last_name)',
  filters: { program_type: z.enum(YOUTH_PROGRAM_TYPES) },
  search: { columns: ['name', 'location', 'description'] },
  order: { column: 'program_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
