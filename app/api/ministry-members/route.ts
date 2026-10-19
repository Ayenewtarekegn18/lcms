import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, cleanSearch, opt, uuid } from '@/lib/api/validation'

type MembershipRow = { member?: { first_name?: string | null; last_name?: string | null } | null }

const membership = z
  .object({ ministry_id: uuid, member_id: uuid, role: opt(z.string().trim().max(100)) })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const ministryId = uuid.safeParse(searchParams.get('ministry_id'))
  if (!ministryId.success) return NextResponse.json({ error: 'ministry_id required' }, { status: 400 })
  const search = cleanSearch(searchParams.get('search'))?.toLowerCase()

  const { data, error } = await auth.supabase
    .from('ministry_members')
    .select('*, member:profiles!member_id(id, first_name, last_name, email, phone)')
    .eq('ministry_id', ministryId.data)
    .eq('is_active', true)
    .order('joined_date', { ascending: false })
    .range(...pageRange(searchParams, 500))
  if (error) return dbError(error)

  const list = (data ?? []) as MembershipRow[]
  const filtered = search
    ? list.filter((r) => `${r.member?.first_name ?? ''} ${r.member?.last_name ?? ''}`.toLowerCase().includes(search))
    : list
  return NextResponse.json(filtered)
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, membership)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('ministry_members')
    .upsert([{ ...body.data, role: body.data.role ?? 'Member', is_active: true }], { onConflict: 'ministry_id,member_id' })
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
