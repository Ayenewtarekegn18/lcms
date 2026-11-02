import { itemRoutes } from '@/lib/api/crud'
import { missionReportUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Correct or delete a mission report (the author stays as recorded).
const item = itemRoutes({ table: 'mission_reports', roles: STAFF, update: missionReportUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
