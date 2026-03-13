import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()
  const status = searchParams.get('status')

  let query = supabase
    .from('spiritual_candidates')
    .select(`
      *,
      member:profiles!member_id(id, first_name, last_name, email, phone),
      mentor:profiles!mentor_id(id, first_name, last_name)
    `)
    .order('joined_date', { ascending: false })

  if (status) query = query.eq('status', status)
  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  let list = rows || []
  if (search) {
    const s = search.toLowerCase()
    list = list.filter((r: { member?: { first_name?: string; last_name?: string } }) => {
      const m = r.member as { first_name?: string; last_name?: string } | null
      if (!m) return false
      const name = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase()
      return name.includes(s)
    })
  }
  return NextResponse.json(list)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { member_id, status: st, mentor_id, progress_notes, joined_date, baptism_date } = body
  if (!member_id) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

  const { data: row, error } = await supabase
    .from('spiritual_candidates')
    .insert([{
      member_id,
      status: st || 'salvation_candidate',
      mentor_id: mentor_id || null,
      progress_notes: progress_notes || null,
      joined_date: joined_date || null,
      baptism_date: baptism_date || null,
    }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(row, { status: 201 })
}
