import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PASTORAL } from '@/lib/auth/roles'
import { parseBody, pageRange, opt, uuid, date } from '@/lib/api/validation'

// Care visit notes are confidential: admin and elder only (assigned deacons also see their own visits via RLS).
const createSchema = z
  .object({
    member_id: uuid,
    visit_date: date,
    notes: opt(z.string().trim().max(5000)),
  })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  const { data, error } = await auth.supabase
    .from('deacon_care_visits')
    .select('*, member:profiles!member_id(id, first_name, last_name), visitor:profiles!visitor_id(id, first_name, last_name)')
    .order('visit_date', { ascending: false })
    .range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { data, error } = await auth.supabase.from('deacon_care_visits').insert([{ ...body.data, visitor_id: auth.user.id }]).select().single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
