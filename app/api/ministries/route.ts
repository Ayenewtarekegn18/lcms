import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, opt, text, uuid } from '@/lib/api/validation'

const createSchema = z
  .object({
    name: text(200),
    description: opt(z.string().trim().max(5000)),
    leader_id: opt(uuid),
    meeting_day: opt(z.string().trim().max(50)),
    meeting_schedule: opt(z.string().trim().max(100)), // older form field, stored as meeting_day
    meeting_time: opt(z.string().trim().max(50)),
    location: opt(z.string().trim().max(200)),
  })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  let query = auth.supabase.from('ministries').select('*').order('name', { ascending: true })
  if (searchParams.get('active') === 'true') query = query.eq('is_active', true)
  const { data, error } = await query.limit(500)
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { meeting_schedule, meeting_day, ...fields } = body.data
  const { data, error } = await auth.supabase
    .from('ministries')
    .insert([{ ...fields, meeting_day: meeting_day ?? meeting_schedule ?? null, is_active: true }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
