import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('baptisms')
    .select('*, member:profiles!member_id(id, first_name, last_name), officiating:profiles!officiating_elder_id(id, first_name, last_name)')
    .order('baptism_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { baptism_date, member_id, officiating_elder_id, location, notes } = body
  if (!baptism_date || !member_id) return NextResponse.json({ error: 'baptism_date and member_id required' }, { status: 400 })
  const { data, error } = await supabase
    .from('baptisms')
    .insert([{ baptism_date, member_id, officiating_elder_id: officiating_elder_id || null, location: location || null, notes: notes || null }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
