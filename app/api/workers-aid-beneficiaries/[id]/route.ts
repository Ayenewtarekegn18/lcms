import { itemRoutes } from '@/lib/api/crud'
import { workersAidBeneficiaryUpdate } from '@/lib/api/schemas'
import { PASTORAL } from '@/lib/auth/roles'

// Change a beneficiary's monthly amount, start date, status or notes, or delete them with their payment
// history (admin and elder, like the RLS).
const item = itemRoutes({ table: 'workers_aid_beneficiaries', roles: PASTORAL, update: workersAidBeneficiaryUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
