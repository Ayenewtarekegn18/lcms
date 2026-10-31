import { z } from 'zod'
import { itemRoutes } from '@/lib/api/crud'
import { FINANCE_DELETE } from '@/lib/auth/roles'

// Deleting a ledger row: admins only, the same rule as the financial_delete policy (RLS), so finance
// gets a clear 403 instead of a silent "not found". Ledger rows aren't edited through this route.
const item = itemRoutes({ table: 'financial_transactions', roles: FINANCE_DELETE, update: z.object({}).strict() })
export const DELETE = item.DELETE
