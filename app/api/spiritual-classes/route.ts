import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, cleanSearch } from '@/lib/api/validation'
import { spiritualClass } from '@/lib/api/schemas'

export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const search = cleanSearch(searchParams.get('search'))

  let query = auth.supabase
    .from('spiritual_classes')
    .select('*, instructor:profiles!instructor_id(id, first_name, last_name)')
    .order('class_date', { ascending: false })
  if (search) query = query.ilike('title', `%${search}%`)
  const { data, error } = await query.range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, spiritualClass)
  if (body.error) return body.error

  const { data, error } = await auth.supabase.from('spiritual_classes').insert([body.data]).select().single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
