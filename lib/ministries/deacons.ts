// Deacons values shared by the API schemas (lib/api/schemas.ts) and the deacons page. No server code here.

export const SUPPORT_CASE_STATUSES = ['open', 'in_progress', 'closed'] as const
export type SupportCaseStatus = (typeof SUPPORT_CASE_STATUSES)[number]

export const SUPPORT_CASE_STATUS_LABELS: Record<SupportCaseStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
}

/** "in_progress" → "In progress"; unknown values (older rows) are shown as stored. */
export const supportCaseStatusLabel = (status: string | null | undefined) =>
  status ? (SUPPORT_CASE_STATUS_LABELS as Record<string, string>)[status] ?? status : 'Open'

/** deacon_support_cases.case_type is free text; the form offers these. */
export const SUPPORT_CASE_TYPES = ['Financial', 'Health', 'Bereavement', 'Family', 'Housing', 'Elderly care', 'Other'] as const
