import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PASTORAL } from '@/lib/auth/roles'
import { charityTotals } from '@/lib/ministries/charity'

// Totals for the charity tabs (admin and elder, like the confidential RLS group): amount requested,
// requests waiting for a decision, and amount paid out. GET → CharityTotals (lib/ministries/charity.ts)
const PAGE = 1000 // PostgREST returns at most this many rows per request

async function readAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string; message: string } | null }>) {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) return { rows, error }
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return { rows, error: null }
  }
}

export async function GET() {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const db = auth.supabase

  const [requests, distributions] = await Promise.all([
    readAll((from, to) => db.from('charity_aid_requests').select('amount_requested, status').order('id').range(from, to)),
    readAll((from, to) => db.from('charity_distributions').select('amount').order('id').range(from, to)),
  ])
  if (requests.error) return dbError(requests.error)
  if (distributions.error) return dbError(distributions.error)
  return NextResponse.json(charityTotals(requests.rows, distributions.rows))
}
