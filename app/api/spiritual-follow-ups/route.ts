import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PASTORAL } from '@/lib/auth/roles'
import { parseBody, pageRange } from '@/lib/api/validation'
import { spiritualFollowUp } from '@/lib/api/schemas'

// Pastoral follow-up notes are confidential: admin and elder only (same as RLS).

export async function GET(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const status = spiritualFollowUp.shape.status.safeParse(searchParams.get('status') ?? undefined)

  let query = auth.supabase
    .from('spiritual_follow_ups')
    .select('*, member:profiles!member_id(id, first_name, last_name)')
    .order('last_contact_date', { ascending: false, nullsFirst: false })
  if (status.success && status.data) query = query.eq('status', status.data)
  const { data, error } = await query.range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const body = await parseBody(req, spiritualFollowUp)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('spiritual_follow_ups')
    .insert([{ ...body.data, status: body.data.status ?? 'ongoing' }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
