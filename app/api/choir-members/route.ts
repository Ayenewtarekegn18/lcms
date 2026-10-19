import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, opt, uuid } from '@/lib/api/validation'

const createSchema = z
  .object({
    member_id: uuid,
    voice_part: opt(z.string().trim().max(50)),
  })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  const { data, error } = await auth.supabase
    .from('choir_members')
    .select('*, member:profiles!member_id(id, first_name, last_name)')
    .order('join_date', { ascending: false })
    .range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { data, error } = await auth.supabase.from('choir_members').insert([body.data]).select().single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
