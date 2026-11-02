import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PASTORAL } from '@/lib/auth/roles'
import { workersAidMonthlyRun } from '@/lib/api/schemas'
import { parseBody } from '@/lib/api/validation'
import { churchToday, monthBounds, MONTH_PATTERN, toCents } from '@/lib/financial/summary'
import { duePayments, shiftMonth, summarize, SUMMARY_MONTHS } from '@/lib/ministries/workers-aid'

// Monthly Workers Aid by month (confidential like the tables: admin and elder only).
//   GET ?month=YYYY-MM (default: this month in church time) → totals for that month and the two before it,
//     the monthly commitment of the active beneficiaries and who is still unpaid that month.
//   POST { disbursement_date } → one payment of their monthly amount for every active beneficiary not yet
//     paid in that date's month; answers { created, total }.

const MAX_ROWS = 5000

export async function GET(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const requested = new URL(req.url).searchParams.get('month')
  if (requested && !MONTH_PATTERN.test(requested)) return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
  const month = requested || churchToday().slice(0, 7)

  const from = monthBounds(shiftMonth(month, -(SUMMARY_MONTHS - 1))).from
  const { to } = monthBounds(month)
  const [beneficiaries, disbursements] = await Promise.all([
    auth.supabase.from('workers_aid_beneficiaries').select('id, monthly_amount, status, start_date').range(0, MAX_ROWS - 1),
    auth.supabase
      .from('workers_aid_disbursements')
      .select('beneficiary_id, disbursement_date, amount')
      .gte('disbursement_date', from)
      .lt('disbursement_date', to)
      .range(0, MAX_ROWS - 1),
  ])
  if (beneficiaries.error) return dbError(beneficiaries.error)
  if (disbursements.error) return dbError(disbursements.error)
  return NextResponse.json(summarize(month, beneficiaries.data ?? [], disbursements.data ?? []))
}

export async function POST(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const body = await parseBody(req, workersAidMonthlyRun)
  if (body.error) return body.error
  const { disbursement_date } = body.data
  const month = disbursement_date.slice(0, 7)
  const { from, to } = monthBounds(month)

  const [beneficiaries, paid] = await Promise.all([
    auth.supabase.from('workers_aid_beneficiaries').select('id, monthly_amount, status, start_date').range(0, MAX_ROWS - 1),
    auth.supabase.from('workers_aid_disbursements').select('beneficiary_id').gte('disbursement_date', from).lt('disbursement_date', to).range(0, MAX_ROWS - 1),
  ])
  if (beneficiaries.error) return dbError(beneficiaries.error)
  if (paid.error) return dbError(paid.error)

  const due = duePayments(beneficiaries.data ?? [], paid.data ?? [], month)
  if (due.length === 0) return NextResponse.json({ created: 0, total: 0 })

  const rows = due.map((b) => ({ beneficiary_id: b.id, disbursement_date, amount: b.monthly_amount }))
  const { error } = await auth.supabase.from('workers_aid_disbursements').insert(rows)
  if (error) return dbError(error)
  const total = rows.reduce((sum, r) => sum + toCents(r.amount), 0) / 100
  return NextResponse.json({ created: rows.length, total }, { status: 201 })
}
