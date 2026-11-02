// Women's Ministry values shared by its API routes and its workspace page. No server code here.

/** women_activities.status: an idea, then on the calendar, then done. */
export const WOMEN_ACTIVITY_STATUSES = ['proposed', 'planned', 'completed'] as const
export type WomenActivityStatus = (typeof WOMEN_ACTIVITY_STATUSES)[number]

export const WOMEN_ACTIVITY_STATUS_OPTIONS = [
  { value: 'proposed', label: 'Proposed' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
] as const satisfies readonly { value: WomenActivityStatus; label: string }[]

export const womenActivityStatusLabel = (status: string | null | undefined) =>
  WOMEN_ACTIVITY_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? null

/** '18:30' from a time column ('18:30:00'), or null. */
export const shortTime = (time: string | null | undefined) => (time ? time.slice(0, 5) : null)
