// Ledger figures for the financial and reports pages and their API routes. Client-safe: no server
// imports (readSummary takes the caller's Supabase client). Totals come from the financial_summary
// view (db/migrations/20261030000001_financial_summary.sql), never from rows added up in the browser.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/** The church keeps its books in Addis Ababa time: "today" and "this month" follow it, not the server's clock. */
export const CHURCH_TIME_ZONE = 'Africa/Addis_Ababa'

export const KINDS = ['income', 'expense'] as const
export type Kind = (typeof KINDS)[number]

/** Shown for legacy rows recorded without a category. */
export const UNCATEGORIZED = 'Uncategorized'

/** YYYY-MM */
export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export type SummaryRow = Database['public']['Views']['financial_summary']['Row']
export type Totals = { income: number; expense: number; net: number; count: number }
export type CategoryTotal = { kind: Kind; category: string; total: number; count: number }

/** A ledger row as the API returns it. */
export type LedgerEntry = {
  id: string
  transaction_date: string | null
  transaction_type: string
  category: string | null
  amount: number
  currency: string | null
  description: string | null
  member_id: string | null
  created_at: string | null
}

/** GET /api/financial */
export type LedgerPage = {
  transactions: LedgerEntry[]
  /** Rows matching the filters (the list shows one page of them). */
  total: number
  offset: number
  limit: number
  /** YYYY-MM-DD and YYYY-MM in the church's time zone. */
  today: string
  month: string
  totals: { allTime: Totals; thisMonth: Totals; period: Totals | null }
  /** Per category for the selected month, or all time. */
  categories: CategoryTotal[]
  /** Months that have transactions, newest first. */
  months: string[]
  permissions: { create: boolean; delete: boolean }
}

const birr = new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' })

/** Money is shown in Birr, e.g. "ETB 1,234.50". */
export const formatBirr = (amount: number) => birr.format(amount)

/** An amount (numeric arrives as a JSON number, sometimes as a string) in whole cents, so sums are exact. */
export function toCents(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

/** Today as YYYY-MM-DD in the church's time zone. */
export function churchToday(now = new Date(), timeZone = CHURCH_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** A month's transactions have transaction_date >= from and < to. */
export function monthBounds(month: string): { from: string; to: string } {
  const [year, m] = month.split('-').map(Number)
  const next = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`
  return { from: `${month}-01`, to: `${next}-01` }
}

/** "2026-10" → "October 2026" */
export function monthLabel(month: string): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`))
}

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** "2026-10-05" → "5 Oct 2026", the same day in every time zone (a bare date is not a moment in time). */
export function formatLedgerDate(date: string | null): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return '—'
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? '—' : dayFormat.format(parsed)
}

const isKind = (value: unknown): value is Kind => value === 'income' || value === 'expense'
const inMonth = (row: SummaryRow, month?: string | null) => !month || row.month?.slice(0, 7) === month

/** Income, expenses and net over the summary rows: all of them, or one month (YYYY-MM). */
export function totalsOf(rows: readonly SummaryRow[], month?: string | null): Totals {
  const cents = { income: 0, expense: 0 }
  let count = 0
  for (const row of rows) {
    if (!inMonth(row, month) || !isKind(row.transaction_type)) continue
    cents[row.transaction_type] += toCents(row.total)
    count += Number(row.transaction_count) || 0
  }
  return { income: cents.income / 100, expense: cents.expense / 100, net: (cents.income - cents.expense) / 100, count }
}

/** Totals per kind and category, largest first. */
export function categoriesOf(rows: readonly SummaryRow[], month?: string | null): CategoryTotal[] {
  const groups = new Map<string, { kind: Kind; category: string; cents: number; count: number }>()
  for (const row of rows) {
    if (!inMonth(row, month) || !isKind(row.transaction_type)) continue
    const category = row.category?.trim() || UNCATEGORIZED
    const key = `${row.transaction_type}:${category}`
    const group = groups.get(key) ?? { kind: row.transaction_type, category, cents: 0, count: 0 }
    group.cents += toCents(row.total)
    group.count += Number(row.transaction_count) || 0
    groups.set(key, group)
  }
  return [...groups.values()]
    .map(({ cents, ...group }) => ({ ...group, total: cents / 100 }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category))
}

/** Months that have transactions (YYYY-MM), newest first. */
export function monthsOf(rows: readonly SummaryRow[]): string[] {
  const months = new Set<string>()
  for (const row of rows) {
    const month = row.month?.slice(0, 7)
    if (month && MONTH_PATTERN.test(month)) months.add(month)
  }
  return [...months].sort().reverse()
}

const SUMMARY_PAGE = 1000

/**
 * Every financial_summary row the caller may read (RLS and the view's role filter apply). Reads in
 * pages until it has the counted total: PostgREST caps each response (1,000 rows by default), and a
 * capped read would silently drop months from the totals.
 */
export async function readSummary(db: SupabaseClient<Database>) {
  const rows: SummaryRow[] = []
  let total = Infinity
  while (rows.length < total) {
    const { data, error, count } = await db
      .from('financial_summary')
      .select('month, transaction_type, category, total, transaction_count', { count: rows.length === 0 ? 'exact' : undefined })
      .order('month', { ascending: false, nullsFirst: false })
      .order('transaction_type')
      .order('category', { nullsFirst: true })
      .range(rows.length, rows.length + SUMMARY_PAGE - 1)
    if (error) return { rows: null, error } as const
    if (typeof count === 'number') total = count
    if (!data?.length) break
    rows.push(...data)
  }
  return { rows, error: null } as const
}
