import { itemRoutes } from '@/lib/api/crud'
import { deaconSupportCaseUpdate } from '@/lib/api/schemas'
import { PASTORAL } from '@/lib/auth/roles'

// Update a support case (type, description, status, assigned deacon) or delete it (admin and elder, like the RLS).
const item = itemRoutes({ table: 'deacon_support_cases', roles: PASTORAL, update: deaconSupportCaseUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
