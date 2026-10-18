import { z } from 'zod'
import { itemRoutes } from '@/lib/api/crud'
import { opt } from '@/lib/api/validation'
import { STAFF } from '@/lib/auth/roles'

const membershipUpdate = z
  .object({ role: opt(z.string().trim().max(100)), is_active: z.boolean() })
  .partial()
  .strict()

// DELETE deactivates the membership (keeps history) instead of removing the row.
const item = itemRoutes({ table: 'ministry_members', roles: STAFF, update: membershipUpdate, softDelete: true })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
