import { itemRoutes } from '@/lib/api/crud'
import { attendanceCorrection } from '@/lib/api/attendance'
import { PAGE_ACCESS } from '@/lib/auth/roles'

// Corrections to one saved record: its status or notes (PATCH), or removing it (DELETE).
const item = itemRoutes({ table: 'attendance_records', roles: PAGE_ACCESS.attendance, update: attendanceCorrection })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
