import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, cleanSearch } from '@/lib/api/validation'
import { spiritualCandidate } from '@/lib/api/schemas'

type CandidateRow = { member?: { first_name?: string | null; last_name?: string | null } | null }

export async function GET(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const search = cleanSearch(searchParams.get('search'))?.toLowerCase()
  const status = spiritualCandidate.shape.status.safeParse(searchParams.get('status') ?? undefined)

  let query = auth.supabase
    .from('spiritual_candidates')
    .select('*, member:profiles!member_id(id, first_name, last_name, email, phone), mentor:profiles!mentor_id(id, first_name, last_name)')
    .order('joined_date', { ascending: false })
  if (status.success && status.data) query = query.eq('status', status.data)
  const { data, error } = await query.range(...pageRange(searchParams))
  if (error) return dbError(error)

  // The name lives on the joined profile, so search is applied to the (bounded) page.
  const list = (data ?? []) as CandidateRow[]
  const filtered = search
    ? list.filter((r) => `${r.member?.first_name ?? ''} ${r.member?.last_name ?? ''}`.toLowerCase().includes(search))
    : list
  return NextResponse.json(filtered)
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, spiritualCandidate)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('spiritual_candidates')
    .insert([{ ...body.data, status: body.data.status ?? 'salvation_candidate' }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
