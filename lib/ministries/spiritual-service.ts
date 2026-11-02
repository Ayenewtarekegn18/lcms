// Spiritual Service values shared by its API routes and its workspace page. No server code here.

/** spiritual_candidates.status, in the order a candidate moves through them. */
export const CANDIDATE_STATUSES = ['salvation_candidate', 'baptism_ready', 'baptized'] as const
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number]

export const CANDIDATE_STATUS_OPTIONS = [
  { value: 'salvation_candidate', label: 'Salvation candidate' },
  { value: 'baptism_ready', label: 'Baptism ready' },
  { value: 'baptized', label: 'Baptized' },
] as const satisfies readonly { value: CandidateStatus; label: string }[]

/** spiritual_follow_ups.follow_up_type */
export const FOLLOW_UP_TYPES = ['post_salvation', 'post_baptism'] as const
export const FOLLOW_UP_TYPE_OPTIONS = [
  { value: 'post_salvation', label: 'Post-salvation' },
  { value: 'post_baptism', label: 'Post-baptism' },
] as const

/** spiritual_follow_ups.status */
export const FOLLOW_UP_STATUSES = ['ongoing', 'completed'] as const
export const FOLLOW_UP_STATUS_OPTIONS = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
] as const

const labelOf = (options: readonly { value: string; label: string }[], value: string | null | undefined) =>
  options.find((o) => o.value === value)?.label ?? null

export const candidateStatusLabel = (status: string | null | undefined) => labelOf(CANDIDATE_STATUS_OPTIONS, status)
export const followUpTypeLabel = (type: string | null | undefined) => labelOf(FOLLOW_UP_TYPE_OPTIONS, type)
export const followUpStatusLabel = (status: string | null | undefined) => labelOf(FOLLOW_UP_STATUS_OPTIONS, status)

/** "12 of 20" seats taken, or just the count when the class has no limit. */
export function attendanceSummary(present: number, max: number | null | undefined) {
  return max ? `${present} of ${max}` : String(present)
}
