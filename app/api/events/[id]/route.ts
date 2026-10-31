import { itemRoutes } from '@/lib/api/crud'
import { PAGE_ACCESS } from '@/lib/auth/roles'
import { eventUpdate } from '@/lib/events/schema'

// Edit or delete one event: same roles as the events page and the staff write policies (RLS).
// Deleting is permanent and also removes attendance recorded for the event (ON DELETE CASCADE),
// so the pages confirm it first.
const item = itemRoutes({ table: 'events', roles: PAGE_ACCESS.events, update: eventUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
