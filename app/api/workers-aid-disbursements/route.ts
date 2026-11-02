import { collectionRoutes } from '@/lib/api/collection'
import { workersAidDisbursementCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { PASTORAL } from '@/lib/auth/roles'

// Monthly Workers Aid payments: confidential (RLS: admin and elder read and write). Monthly totals and
// "record this month's payments" are in ./months.   GET ?beneficiary_id= &limit=&offset=
//   POST { beneficiary_id, disbursement_date, amount, notes? }
const list = collectionRoutes({
  table: 'workers_aid_disbursements',
  roles: { read: PASTORAL, write: PASTORAL },
  create: workersAidDisbursementCreate,
  select: '*, beneficiary:workers_aid_beneficiaries(id, monthly_amount, member:profiles!member_id(id, first_name, last_name))',
  filters: { beneficiary_id: uuid },
  order: [{ column: 'disbursement_date', ascending: false }, { column: 'created_at', ascending: false }],
})
export const GET = list.GET
export const POST = list.POST
