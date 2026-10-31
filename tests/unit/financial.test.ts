import { describe, expect, it } from 'vitest'
import { toCsv } from '@/lib/csv'
import {
  categoriesOf, churchToday, formatBirr, formatLedgerDate, monthBounds, monthLabel, monthsOf, toCents, totalsOf,
  UNCATEGORIZED, type SummaryRow,
} from '@/lib/financial/summary'
import { reportCsvRows, type ReportFigures } from '@/lib/reports/figures'

const row = (month: string, transaction_type: string, category: string | null, total: number | string, count = 1): SummaryRow =>
  ({ month: `${month}-01`, transaction_type, category, total: total as number, transaction_count: count })

const rows: SummaryRow[] = [
  row('2026-10', 'income', 'Tithes', 1000.1, 3),
  row('2026-10', 'income', 'Offerings', '200.2', 2), // numeric may arrive as a string
  row('2026-10', 'expense', 'Utilities', 300.3),
  row('2026-09', 'income', 'Tithes', 50),
  row('2026-09', 'expense', null, 25.05),
  row('2026-09', 'transfer', 'Odd', 999), // not a known kind: ignored
]

describe('toCents', () => {
  it('reads numbers and numeric strings exactly, anything else as 0', () => {
    expect(toCents(0.1)).toBe(10)
    expect(toCents('19.99')).toBe(1999)
    expect(toCents(null)).toBe(0)
    expect(toCents('')).toBe(0)
    expect(toCents('abc')).toBe(0)
    expect(toCents(Infinity)).toBe(0)
  })
})

describe('totalsOf', () => {
  it('sums all time in whole cents, without floating-point drift', () => {
    expect(totalsOf(rows)).toEqual({ income: 1250.3, expense: 325.35, net: 924.95, count: 8 })
  })
  it('sums one month', () => {
    expect(totalsOf(rows, '2026-09')).toEqual({ income: 50, expense: 25.05, net: 24.95, count: 2 })
  })
  it('is zero for an empty ledger or a month without rows', () => {
    expect(totalsOf([])).toEqual({ income: 0, expense: 0, net: 0, count: 0 })
    expect(totalsOf(rows, '2025-01')).toEqual({ income: 0, expense: 0, net: 0, count: 0 })
  })
})

describe('categoriesOf', () => {
  it('groups by kind and category, largest first, naming missing categories', () => {
    expect(categoriesOf(rows)).toEqual([
      { kind: 'income', category: 'Tithes', total: 1050.1, count: 4 },
      { kind: 'expense', category: 'Utilities', total: 300.3, count: 1 },
      { kind: 'income', category: 'Offerings', total: 200.2, count: 2 },
      { kind: 'expense', category: UNCATEGORIZED, total: 25.05, count: 1 },
    ])
  })
  it('keeps income and expense of the same category apart', () => {
    const same = [row('2026-10', 'income', 'Other', 10), row('2026-10', 'expense', 'Other', 5)]
    expect(categoriesOf(same).map((c) => c.kind)).toEqual(['income', 'expense'])
  })
  it('filters by month', () => {
    expect(categoriesOf(rows, '2026-09').map((c) => c.category)).toEqual(['Tithes', UNCATEGORIZED])
  })
})

describe('months', () => {
  it('lists months with transactions, newest first', () => {
    expect(monthsOf(rows)).toEqual(['2026-10', '2026-09'])
  })
  it('gives month bounds, across the year end', () => {
    expect(monthBounds('2026-10')).toEqual({ from: '2026-10-01', to: '2026-11-01' })
    expect(monthBounds('2026-12')).toEqual({ from: '2026-12-01', to: '2027-01-01' })
  })
  it('names months', () => {
    expect(monthLabel('2026-10')).toBe('October 2026')
  })
})

describe('churchToday', () => {
  it('follows Addis Ababa time (UTC+3), not the server clock', () => {
    expect(churchToday(new Date('2026-10-31T20:59:00Z'))).toBe('2026-10-31')
    expect(churchToday(new Date('2026-10-31T21:00:00Z'))).toBe('2026-11-01')
  })
})

describe('formatting', () => {
  it('shows Birr', () => {
    expect(formatBirr(1234.5)).toMatch(/1,234\.50/)
    expect(formatBirr(1234.5)).toMatch(/ETB|Br/)
  })
  it('shows a ledger date as the same day everywhere, and a dash when missing', () => {
    expect(formatLedgerDate('2026-10-05')).toBe('5 Oct 2026')
    expect(formatLedgerDate(null)).toBe('—')
    expect(formatLedgerDate('not a date')).toBe('—')
  })
})

describe('toCsv', () => {
  it('quotes separators, quotes and line breaks', () => {
    expect(toCsv([['a,b', 'say "hi"', 'two\nlines', 3, null]])).toBe('"a,b","say ""hi""","two\nlines",3,')
  })
  it('keeps spreadsheet formulas as plain text', () => {
    expect(toCsv([['=HYPERLINK("x")', '+1', '-2', '@SUM']])).toBe(`"'=HYPERLINK(""x"")",'+1,'-2,'@SUM`)
  })
  it('keeps negative numbers as numbers', () => {
    expect(toCsv([[-5]])).toBe('-5')
  })
  it('separates rows with CRLF', () => {
    expect(toCsv([['a'], ['b']])).toBe('a\r\nb')
  })
})

describe('reportCsvRows', () => {
  const counts = { members_total: 10, members_active: 7, ministries_active: 3, events_upcoming: 2, attendance_total: 40 }
  const totals = { income: 100, expense: 40, net: 60, count: 3 }

  it('lists the counts, and money only when the role reads the ledger', () => {
    const withoutMoney = reportCsvRows({ month: '2026-10', counts, finance: null })
    expect(withoutMoney).toContainEqual(['Inactive', 3])
    expect(withoutMoney.some(([label]) => String(label).includes('ETB'))).toBe(false)

    const report: ReportFigures = { month: '2026-10', counts, finance: { thisMonth: totals, allTime: totals, categories: [] } }
    expect(reportCsvRows(report)).toContainEqual(['Income 2026-10 (ETB)', 100])
    expect(reportCsvRows(report)).toContainEqual(['Net all time (ETB)', 60])
  })
})
