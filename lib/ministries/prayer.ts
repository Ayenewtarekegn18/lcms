// Prayer Groups values shared by the API schemas (lib/api/schemas.ts) and the prayer groups page. No server code here.

export const PRAYER_REQUEST_STATUSES = ['open', 'answered', 'closed'] as const
export type PrayerRequestStatus = (typeof PRAYER_REQUEST_STATUSES)[number]

const STATUS_LABELS: Record<PrayerRequestStatus, string> = { open: 'Open', answered: 'Answered', closed: 'Closed' }
export const PRAYER_REQUEST_STATUS_OPTIONS = PRAYER_REQUEST_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))

/**
 * A request's status as one of the three. Rows written before the workspace hold the column default
 * 'active' (or nothing); both mean the request is still open.
 */
export function normalizePrayerStatus(status: string | null | undefined): PrayerRequestStatus {
  const key = (status ?? '').trim().toLowerCase()
  return (PRAYER_REQUEST_STATUSES as readonly string[]).includes(key) ? (key as PrayerRequestStatus) : 'open'
}
export const prayerStatusLabel = (status: string | null | undefined) => STATUS_LABELS[normalizePrayerStatus(status)]
