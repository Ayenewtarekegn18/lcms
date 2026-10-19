import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PASTORAL } from '@/lib/auth/roles'
import { parseBody, pageRange, opt, uuid, amount } from '@/lib/api/validation'

// Charity requests are confidential: admin and elder only (same as RLS).
const createSchema = z
  .object({
    member_id: uuid,
    amount_requested: opt(amount),
    reason: opt(z.string().trim().max(5000)),
  })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  const { data, error } = await auth.supabase
    .from('charity_aid_requests')
    .select('*, member:profiles!member_id(id, first_name, last_name)')
    .order('request_date', { ascending: false })
    .range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { data, error } = await auth.supabase.from('charity_aid_requests').insert([{ ...body.data, status: 'pending' }]).select().single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
