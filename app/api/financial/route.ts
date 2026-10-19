import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  let query = supabase
    .from('financial_transactions')
    .select('*')
    .order('transaction_date', { ascending: false })

  if (type) {
    query = query.eq('transaction_type', type)
  }

  if (startDate) {
    query = query.gte('transaction_date', startDate)
  }

  if (endDate) {
    query = query.lte('transaction_date', endDate)
  }

  const { data: rows, error } = await query

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  const transactions = (rows || []).map((t) => ({
    ...(t as Record<string, unknown>),
    type: (t as { transaction_type?: string; type?: string }).transaction_type ?? (t as { type?: string }).type,
    amount: Number((t as { amount?: unknown }).amount) || 0,
  }))
  const totals = {
    income: transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    expense: transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    total: transactions.reduce((sum, t) => {
      if (t.type === 'income') return sum + (t.amount || 0)
      if (t.type === 'expense') return sum - (t.amount || 0)
      return sum
    }, 0),
  }

  return NextResponse.json({
    transactions,
    totals,
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: transaction, error } = await supabase
    .from('financial_transactions')
    .insert([
      {
        transaction_type: body.type ?? body.transaction_type ?? 'income',
        category: body.category ?? null,
        amount: body.amount,
        description: body.description ?? null,
        transaction_date: body.transaction_date ?? new Date().toISOString().slice(0, 10),
        member_id: body.member_id ?? null,
        recorded_by_id: user.id,
        notes: body.notes ?? null,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(transaction, { status: 201 })
}
