import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { FINANCE_DELETE, FINANCE_READ, FINANCE_WRITE } from '@/lib/auth/roles'
import { parseBody, pageRange, opt, amount, date, text, uuid } from '@/lib/api/validation'
import {
  KINDS, MONTH_PATTERN, categoriesOf, churchToday, monthBounds, monthsOf, readSummary, totalsOf, type LedgerPage,
} from '@/lib/financial/summary'

// The columns the list shows and the CSV exports.
const COLUMNS = 'id, transaction_date, transaction_type, category, amount, currency, description, member_id, created_at'

const kind = z.enum(KINDS)

// amount is numeric(10,2): positive, at most 99,999,999.99, at most two decimals
const money = amount
  .max(99_999_999.99)
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'At most two decimals')

// The fields a client may send. recorded_by_id comes from the session; id and timestamps from the
// database. Unknown keys are rejected. The ledger is kept in Birr.
const createSchema = z
  .object({
    transaction_type: kind,
    category: text(100),
    amount: money,
    currency: z.literal('ETB').default('ETB'),
    description: opt(z.string().trim().max(500)),
    member_id: opt(uuid),
    transaction_date: opt(date),
  })
  .strict()

const listFilters = z.object({
  type: kind.optional(),
  month: z.string().regex(MONTH_PATTERN, 'Expected YYYY-MM').optional(),
})

// One page of the ledger, newest first, plus the totals from financial_summary (computed in the database).
export async function GET(req: Request) {
  const auth = await requireRole(...FINANCE_READ)
  if (auth.error) return auth.error

  const params = new URL(req.url).searchParams
  const filters = listFilters.safeParse({ type: params.get('type') || undefined, month: params.get('month') || undefined })
  if (!filters.success) {
    return NextResponse.json({ error: 'Invalid request', issues: z.flattenError(filters.error) }, { status: 400 })
  }
  const { type, month } = filters.data
  const [from, to] = pageRange(params, 50)

  let list = auth.supabase.from('financial_transactions').select(COLUMNS, { count: 'exact' })
  if (type) list = list.eq('transaction_type', type)
  if (month) {
    const bounds = monthBounds(month)
    list = list.gte('transaction_date', bounds.from).lt('transaction_date', bounds.to)
  }
  const [page, summary] = await Promise.all([
    list
      .order('transaction_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(from, to),
    readSummary(auth.supabase),
  ])
  if (page.error) return dbError(page.error)
  if (summary.error) return dbError(summary.error)

  const today = churchToday()
  const thisMonth = today.slice(0, 7)
  return NextResponse.json({
    transactions: (page.data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })),
    total: page.count ?? 0,
    offset: from,
    limit: to - from + 1,
    today,
    month: thisMonth,
    totals: {
      allTime: totalsOf(summary.rows),
      thisMonth: totalsOf(summary.rows, thisMonth),
      period: month ? totalsOf(summary.rows, month) : null,
    },
    categories: categoriesOf(summary.rows, month),
    months: monthsOf(summary.rows),
    permissions: { create: FINANCE_WRITE.includes(auth.role), delete: FINANCE_DELETE.includes(auth.role) },
  } satisfies LedgerPage)
}

export async function POST(req: Request) {
  const auth = await requireRole(...FINANCE_WRITE)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('financial_transactions')
    .insert({
      ...body.data,
      transaction_date: body.data.transaction_date ?? churchToday(),
      recorded_by_id: auth.user.id,
    })
    .select(COLUMNS)
    .single()
  if (error) return dbError(error)
  return NextResponse.json({ ...data, amount: Number(data.amount) }, { status: 201 })
}
