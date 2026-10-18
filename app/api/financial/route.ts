import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { FINANCE_READ, FINANCE_WRITE } from '@/lib/auth/roles'
import { parseBody, pageRange, opt, amount, date, uuid } from '@/lib/api/validation'

const kind = z.enum(['income', 'expense'])

const createSchema = z
  .object({
    type: opt(kind),
    transaction_type: opt(kind),
    category: opt(z.string().trim().max(100)),
    amount,
    description: opt(z.string().trim().max(500)),
    transaction_date: opt(date),
    member_id: opt(uuid),
    notes: opt(z.string().trim().max(5000)),
  })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole(...FINANCE_READ)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const type = z.string().max(50).safeParse(searchParams.get('type'))
  const startDate = date.safeParse(searchParams.get('start_date'))
  const endDate = date.safeParse(searchParams.get('end_date'))

  let query = auth.supabase.from('financial_transactions').select('*').order('transaction_date', { ascending: false })
  if (type.success && type.data) query = query.eq('transaction_type', type.data)
  if (startDate.success) query = query.gte('transaction_date', startDate.data)
  if (endDate.success) query = query.lte('transaction_date', endDate.data)
  const { data: rows, error } = await query.range(...pageRange(searchParams, 500))
  if (error) return dbError(error)

  const transactions = (rows ?? []).map((t: { transaction_type?: string; amount?: unknown }) => ({
    ...t,
    type: t.transaction_type,
    amount: Number(t.amount) || 0,
  }))
  // Sum in whole cents to avoid floating-point drift.
  const cents = (kindName: string) =>
    transactions.filter((t) => t.type === kindName).reduce((sum, t) => sum + Math.round(t.amount * 100), 0)
  const income = cents('income')
  const expense = cents('expense')
  const totals = { income: income / 100, expense: expense / 100, total: (income - expense) / 100 }

  return NextResponse.json({ transactions, totals })
}

export async function POST(req: Request) {
  const auth = await requireRole(...FINANCE_WRITE)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { type, transaction_type, transaction_date, ...fields } = body.data
  const { data, error } = await auth.supabase
    .from('financial_transactions')
    .insert([{
      ...fields,
      transaction_type: type ?? transaction_type ?? 'income',
      transaction_date: transaction_date ?? new Date().toISOString().slice(0, 10),
      recorded_by_id: auth.user.id,
    }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
