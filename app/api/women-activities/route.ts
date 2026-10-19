import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, cleanSearch } from '@/lib/api/validation'
import { womenActivity } from '@/lib/api/schemas'

export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const search = cleanSearch(searchParams.get('search'))
  const status = womenActivity.shape.status.safeParse(searchParams.get('status') ?? undefined)

  let query = auth.supabase.from('women_activities').select('*').order('activity_date', { ascending: false, nullsFirst: false })
  if (status.success && status.data) query = query.eq('status', status.data)
  if (search) query = query.ilike('title', `%${search}%`)
  const { data, error } = await query.range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, womenActivity)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('women_activities')
    .insert([{ ...body.data, status: body.data.status ?? 'proposed', volunteers_count: body.data.volunteers_count ?? 0 }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
