import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange } from '@/lib/api/validation'
import { baptism } from '@/lib/api/schemas'

export async function GET(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  const { data, error } = await auth.supabase
    .from('baptisms')
    .select('*, member:profiles!member_id(id, first_name, last_name), officiating:profiles!officiating_elder_id(id, first_name, last_name)')
    .order('baptism_date', { ascending: false })
    .range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, baptism)
  if (body.error) return body.error

  const { data, error } = await auth.supabase.from('baptisms').insert([body.data]).select().single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
