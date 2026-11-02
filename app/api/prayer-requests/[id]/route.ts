import { itemRoutes } from '@/lib/api/crud'
import { prayerRequestUpdate } from '@/lib/api/schemas'
import { PASTORAL } from '@/lib/auth/roles'

// Mark a prayer request answered or closed, move it to another group, or delete it: pastors and
// elders only (RLS: prayer_requests is confidential; members may only add and read their own).
const item = itemRoutes({ table: 'prayer_requests', roles: PASTORAL, update: prayerRequestUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
