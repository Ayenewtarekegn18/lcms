// Figures on the reports page (GET /api/reports). Client-safe. Every number comes from the database:
// counts from report_summary(), money from financial_summary (db/migrations/20261030000001_financial_summary.sql).
import type { Database } from '@/lib/database.types'
import type { CategoryTotal, Totals } from '@/lib/financial/summary'

export type ReportCounts = Database['public']['Functions']['report_summary']['Returns'][number]

export type ReportFigures = {
  /** This month (YYYY-MM) in the church's time zone. */
  month: string
  counts: ReportCounts
  /** null for roles that don't read the ledger (ministry leaders). */
  finance: { thisMonth: Totals; allTime: Totals; categories: CategoryTotal[] } | null
}

/** Rows of the reports CSV export: the figures the page shows, money in Birr. */
export function reportCsvRows(report: ReportFigures): (string | number)[][] {
  const { counts, finance } = report
  const rows: (string | number)[][] = [
    ['Figure', 'Value'],
    ['People on record', counts.members_total],
    ['Active members', counts.members_active],
    ['Inactive', Math.max(counts.members_total - counts.members_active, 0)],
    ['Active ministries', counts.ministries_active],
    ['Upcoming events', counts.events_upcoming],
    ['Attendance records', counts.attendance_total],
  ]
  if (finance) {
    rows.push(
      [`Income ${report.month} (ETB)`, finance.thisMonth.income],
      [`Expenses ${report.month} (ETB)`, finance.thisMonth.expense],
      [`Net ${report.month} (ETB)`, finance.thisMonth.net],
      ['Income all time (ETB)', finance.allTime.income],
      ['Expenses all time (ETB)', finance.allTime.expense],
      ['Net all time (ETB)', finance.allTime.net],
    )
  }
  return rows
}
