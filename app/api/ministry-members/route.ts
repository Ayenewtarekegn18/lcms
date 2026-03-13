import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const ministry_id = searchParams.get('ministry_id')
  const search = searchParams.get('search')?.trim()
  if (!ministry_id) return NextResponse.json({ error: 'ministry_id required' }, { status: 400 })
  let query = supabase
    .from('ministry_members')
    .select('*, member:profiles!member_id(id, first_name, last_name, email, phone)')
    .eq('ministry_id', ministry_id)
    .eq('is_active', true)
    .order('joined_date', { ascending: false })
  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  let list = rows || []
  if (search) {
    const s = search.toLowerCase()
    list = list.filter((r: { member?: { first_name?: string; last_name?: string } }) => {
      const m = r.member as { first_name?: string; last_name?: string } | null
      if (!m) return false
      return `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase().includes(s)
    })
  }
  return NextResponse.json(list)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { ministry_id, member_id, role } = body
  if (!ministry_id || !member_id) return NextResponse.json({ error: 'ministry_id and member_id required' }, { status: 400 })
  const { data, error } = await supabase
    .from('ministry_members')
    .upsert([{ ministry_id, member_id, role: role || 'Member', is_active: true }], { onConflict: 'ministry_id,member_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
