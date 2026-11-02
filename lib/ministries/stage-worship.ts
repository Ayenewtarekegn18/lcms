// Stage & Worship values shared by the API schemas (lib/api/schemas.ts) and the stage-worship page. No server code here.

import { choiceValues } from './options'

export const WORSHIP_TYPES = [
  { value: 'sunday_service', label: 'Sunday service' },
  { value: 'midweek', label: 'Midweek service' },
  { value: 'youth', label: 'Youth service' },
  { value: 'prayer_night', label: 'Prayer night' },
  { value: 'special', label: 'Special service' },
] as const
export const WORSHIP_TYPE_VALUES = choiceValues(WORSHIP_TYPES)

/** worship_equipment.status; the column defaults to 'available'. */
export const EQUIPMENT_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'in_repair', label: 'In repair' },
  { value: 'retired', label: 'Retired' },
] as const
export const EQUIPMENT_STATUS_VALUES = choiceValues(EQUIPMENT_STATUSES)
