import { itemRoutes } from '@/lib/api/crud'
import { spiritualFollowUpUpdate } from '@/lib/api/schemas'
import { PASTORAL } from '@/lib/auth/roles'

// Pastoral follow-up notes are confidential: admin and elder only (same as RLS).
const item = itemRoutes({ table: 'spiritual_follow_ups', roles: PASTORAL, update: spiritualFollowUpUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
