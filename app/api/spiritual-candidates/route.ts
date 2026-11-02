import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { spiritualCandidate } from '@/lib/api/schemas'
import { CANDIDATE_STATUSES } from '@/lib/ministries/spiritual-service'
import { STAFF } from '@/lib/auth/roles'

// Salvation and baptism candidates (spiritual_candidates is staff-only under RLS).
//   GET ?search= (candidate's name) &status= &limit=&offset=
//   POST { member_id, status?, mentor_id?, progress_notes?, joined_date?, baptism_date? }
const list = collectionRoutes({
  table: 'spiritual_candidates',
  roles: { read: STAFF, write: STAFF },
  create: spiritualCandidate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name, email, phone), mentor:profiles!mentor_id(id, first_name, last_name)',
  filters: { status: z.enum(CANDIDATE_STATUSES) },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: { column: 'joined_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
