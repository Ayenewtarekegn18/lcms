import { itemRoutes } from '@/lib/api/crud'
import { workersAidDisbursementUpdate } from '@/lib/api/schemas'
import { PASTORAL } from '@/lib/auth/roles'

// Correct a payment's date, amount or notes, or delete it (admin and elder, like the RLS).
const item = itemRoutes({ table: 'workers_aid_disbursements', roles: PASTORAL, update: workersAidDisbursementUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
