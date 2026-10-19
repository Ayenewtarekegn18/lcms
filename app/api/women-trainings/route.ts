import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, cleanSearch } from '@/lib/api/validation'
import { womenTraining } from '@/lib/api/schemas'

export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const search = cleanSearch(searchParams.get('search'))

  let query = auth.supabase.from('women_trainings').select('*').order('training_date', { ascending: false, nullsFirst: false })
  if (search) query = query.ilike('title', `%${search}%`)
  const { data, error } = await query.range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, womenTraining)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('women_trainings')
    .insert([{ ...body.data, registered_count: body.data.registered_count ?? 0 }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
