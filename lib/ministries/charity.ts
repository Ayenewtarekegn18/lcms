// Charity values shared by the API routes and the charity page. No server code here.
import { toCents } from '@/lib/financial/summary'

/** charity_aid_requests.status (column default 'pending'). */
export const AID_STATUSES = ['pending', 'approved', 'rejected', 'paid'] as const
export type AidStatus = (typeof AID_STATUSES)[number]

const STATUS_LABELS: Record<AidStatus, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', paid: 'Paid' }

export const AID_STATUS_OPTIONS = AID_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))

const isAidStatus = (s: unknown): s is AidStatus => (AID_STATUSES as readonly unknown[]).includes(s)

export const aidStatusLabel = (status: string | null | undefined) =>
  isAidStatus(status) ? STATUS_LABELS[status] : status?.trim() || STATUS_LABELS.pending

/** Requests money may be paid out against: a distribution needs an approved (or already paid) request. */
export const PAYABLE_STATUSES: readonly AidStatus[] = ['approved', 'paid']

/**
 * The review columns to write when a request's status changes from `before` to `after`: approving or
 * rejecting records who decided and when; going back to pending clears that; anything else (no change,
 * or approved → paid) leaves the review as it is.
 */
export function reviewStamp(
  before: string | null | undefined,
  after: string | null | undefined,
  reviewerId: string,
  now: Date = new Date(),
): { reviewed_by_id: string | null; reviewed_at: string | null } | null {
  if (!after || after === before) return null
  if (after === 'approved' || after === 'rejected') return { reviewed_by_id: reviewerId, reviewed_at: now.toISOString() }
  if (after === 'pending') return { reviewed_by_id: null, reviewed_at: null }
  return null
}

export type CharityTotals = {
  /** Sum of amount_requested over every request, in Birr. */
  requested: number
  requests: number
  /** Requests still waiting for a decision. */
  pending: number
  /** Sum of every distribution, in Birr. */
  paid: number
  distributions: number
}

/** Totals for the charity tabs, added up in whole cents so they are exact. */
export function charityTotals(
  requests: readonly { amount_requested: unknown; status: string | null }[],
  distributions: readonly { amount: unknown }[],
): CharityTotals {
  const requested = requests.reduce((sum, r) => sum + toCents(r.amount_requested), 0)
  const paid = distributions.reduce((sum, d) => sum + toCents(d.amount), 0)
  return {
    requested: requested / 100,
    requests: requests.length,
    pending: requests.filter((r) => (r.status ?? 'pending') === 'pending').length,
    paid: paid / 100,
    distributions: distributions.length,
  }
}
