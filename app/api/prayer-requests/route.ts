import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { parseBody, pageRange, opt, text, uuid } from '@/lib/api/validation'

// Any member may submit and read their own requests; admin/elder see all (enforced by RLS).
const createSchema = z
  .object({
    group_id: opt(uuid),
    request_text: text(5000),
    status: opt(z.string().trim().max(50)),
  })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const groupId = uuid.safeParse(searchParams.get('group_id'))

  let query = auth.supabase
    .from('prayer_requests')
    .select('*, requested_by:profiles!requested_by_id(id, first_name, last_name)')
    .order('created_at', { ascending: false })
  if (groupId.success) query = query.eq('group_id', groupId.data)
  const { data, error } = await query.range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('prayer_requests')
    .insert([{ ...body.data, requested_by_id: auth.user.id, status: body.data.status ?? 'active' }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
