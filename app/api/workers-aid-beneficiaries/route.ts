import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { workersAidBeneficiaryCreate } from '@/lib/api/schemas'
import { BENEFICIARY_STATUSES } from '@/lib/ministries/workers-aid'
import { PASTORAL } from '@/lib/auth/roles'

// Monthly Workers Aid beneficiaries: aid amounts are confidential (RLS: admin and elder read and write).
//   GET ?search= (member's name) &status= &limit=&offset=
//   POST { member_id, monthly_amount, start_date? (default today), status?, notes? }; one row per person.
const list = collectionRoutes({
  table: 'workers_aid_beneficiaries',
  roles: { read: PASTORAL, write: PASTORAL },
  create: workersAidBeneficiaryCreate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name)',
  filters: { status: z.enum(BENEFICIARY_STATUSES) },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: [{ column: 'status' }, { column: 'start_date', ascending: false }],
})
export const GET = list.GET
export const POST = list.POST
