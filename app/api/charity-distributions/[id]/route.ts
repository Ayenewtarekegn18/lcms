import { itemRoutes } from '@/lib/api/crud'
import { charityDistributionUpdate } from '@/lib/api/schemas'
import { PASTORAL } from '@/lib/auth/roles'

// Edit or delete a distribution (admin and elder, like the confidential RLS group).
const item = itemRoutes({ table: 'charity_distributions', roles: PASTORAL, update: charityDistributionUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
