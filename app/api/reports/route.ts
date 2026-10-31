import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { FINANCE_READ, PAGE_ACCESS } from '@/lib/auth/roles'
import { categoriesOf, churchToday, readSummary, totalsOf } from '@/lib/financial/summary'
import type { ReportFigures } from '@/lib/reports/figures'

// Real figures only. Counts come from report_summary(): aggregates, no personal data, for every role
// that may open the reports page. Money comes from financial_summary, for the roles that read the
// ledger; ministry leaders get no money figures, as row-level security gives them no ledger rows.
export async function GET() {
  const auth = await requireRole(...PAGE_ACCESS.reports)
  if (auth.error) return auth.error

  const readsLedger = FINANCE_READ.includes(auth.role)
  const [counts, summary] = await Promise.all([
    auth.supabase.rpc('report_summary').single(),
    readsLedger ? readSummary(auth.supabase) : null,
  ])
  if (counts.error) return dbError(counts.error)
  if (summary?.error) return dbError(summary.error)

  const month = churchToday().slice(0, 7)
  return NextResponse.json({
    month,
    counts: counts.data,
    finance: summary
      ? { thisMonth: totalsOf(summary.rows, month), allTime: totalsOf(summary.rows), categories: categoriesOf(summary.rows, month) }
      : null,
  } satisfies ReportFigures)
}
