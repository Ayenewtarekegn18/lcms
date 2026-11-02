// Monthly Workers Aid values and figures shared by the API (lib/api/schemas.ts, the months route) and the
// workers-aid page. No server code here. Sums are kept in whole cents so they are exact.
import { monthBounds, toCents } from '@/lib/financial/summary'

export const BENEFICIARY_STATUSES = ['active', 'inactive'] as const
export type BeneficiaryStatus = (typeof BENEFICIARY_STATUSES)[number]

/** How many months of totals the workspace shows (this month and the ones before it). */
export const SUMMARY_MONTHS = 3

type Beneficiary = { id: string; monthly_amount: number | string; status: string | null; start_date: string }
type Disbursement = { beneficiary_id: string; disbursement_date: string; amount: number | string }

export type MonthTotal = { month: string; total: number; payments: number }
export type WorkersAidSummary = {
  /** The month the summary is about (YYYY-MM), usually the current one in church time. */
  month: string
  /** `month` first, then the months before it. */
  months: MonthTotal[]
  /** What the active beneficiaries are owed each month. */
  commitment: { total: number; beneficiaries: number }
  /** Active beneficiaries with no payment recorded in `month` yet. */
  due: { total: number; beneficiaries: number }
}

const wholeBirr = new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 0, maximumFractionDigits: 0 })
/** A total for a figure card, in whole Birr: "ETB 12,346". */
export const formatBirrWhole = (amount: number) => wholeBirr.format(amount)

const shortMonth = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
/** "2026-09" → "Sep 2026" */
export const shortMonthLabel = (month: string) => shortMonth.format(new Date(`${month}-01T00:00:00Z`))

/** status is nullable with default 'active': anything but 'inactive' counts as active. */
export const isActiveBeneficiary = (b: Pick<Beneficiary, 'status'>) => b.status !== 'inactive'

/** "2026-01", -1 → "2025-12" */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number)
  const index = year * 12 + (m - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

/** ["2026-10", "2026-09", "2026-08"] for ("2026-10", 3). */
export const recentMonths = (month: string, count: number) => Array.from({ length: count }, (_, i) => shiftMonth(month, -i))

/** Total and number of payments per month, in the order of `months`; months without payments are 0. */
export function monthlyTotals(rows: readonly Pick<Disbursement, 'disbursement_date' | 'amount'>[], months: readonly string[]): MonthTotal[] {
  const cents = new Map(months.map((m) => [m, { cents: 0, payments: 0 }]))
  for (const row of rows) {
    const bucket = cents.get(row.disbursement_date.slice(0, 7))
    if (!bucket) continue
    bucket.cents += toCents(row.amount)
    bucket.payments += 1
  }
  return months.map((month) => {
    const b = cents.get(month)!
    return { month, total: b.cents / 100, payments: b.payments }
  })
}

/**
 * Active beneficiaries who should be paid in `month` (they started on or before its last day) and have no
 * payment in it yet: what "Record this month's payments" adds, one payment of their monthly amount each.
 */
export function duePayments<B extends Beneficiary>(
  beneficiaries: readonly B[],
  paidInMonth: readonly Pick<Disbursement, 'beneficiary_id'>[],
  month: string,
): B[] {
  const paid = new Set(paidInMonth.map((d) => d.beneficiary_id))
  const { to } = monthBounds(month)
  return beneficiaries.filter((b) => isActiveBeneficiary(b) && b.start_date < to && !paid.has(b.id))
}

const sumCents = (beneficiaries: readonly Pick<Beneficiary, 'monthly_amount'>[]) =>
  beneficiaries.reduce((sum, b) => sum + toCents(b.monthly_amount), 0)

/** The figures at the top of the Disbursements tab. `disbursements` must cover the months shown. */
export function summarize(
  month: string,
  beneficiaries: readonly Beneficiary[],
  disbursements: readonly Disbursement[],
  months = SUMMARY_MONTHS,
): WorkersAidSummary {
  const active = beneficiaries.filter(isActiveBeneficiary)
  const due = duePayments(beneficiaries, disbursements.filter((d) => d.disbursement_date.startsWith(month)), month)
  return {
    month,
    months: monthlyTotals(disbursements, recentMonths(month, months)),
    commitment: { total: sumCents(active) / 100, beneficiaries: active.length },
    due: { total: sumCents(due) / 100, beneficiaries: due.length },
  }
}
