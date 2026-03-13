import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let query = supabase
    .from('spiritual_follow_ups')
    .select('*, member:profiles!member_id(id, first_name, last_name)')
    .order('last_contact_date', { ascending: false, nullsFirst: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { member_id, follow_up_type, last_contact_date, notes, status: st } = body
  if (!member_id || !follow_up_type) return NextResponse.json({ error: 'member_id and follow_up_type required' }, { status: 400 })
  const { data, error } = await supabase
    .from('spiritual_follow_ups')
    .insert([{ member_id, follow_up_type, last_contact_date: last_contact_date || null, notes: notes || null, status: st || 'ongoing' }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
