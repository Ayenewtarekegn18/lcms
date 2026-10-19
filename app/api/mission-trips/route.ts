import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, opt, text, date } from '@/lib/api/validation'

const createSchema = z
  .object({
    title: text(200),
    trip_date: opt(date),
    location: opt(z.string().trim().max(200)),
    description: opt(z.string().trim().max(5000)),
    status: opt(z.string().trim().max(50)),
  })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  const { data, error } = await auth.supabase
    .from('mission_trips')
    .select('*')
    .order('trip_date', { ascending: false, nullsFirst: false })
    .range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { data, error } = await auth.supabase.from('mission_trips').insert([{ ...body.data, status: body.data.status ?? 'planned' }]).select().single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
