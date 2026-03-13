import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('deacon_care_visits').select('*, member:profiles!member_id(id, first_name, last_name), visitor:profiles!visitor_id(id, first_name, last_name)').order('visit_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { member_id, visit_date, notes } = body
  if (!member_id || !visit_date) return NextResponse.json({ error: 'member_id and visit_date required' }, { status: 400 })
  const { data, error } = await supabase.from('deacon_care_visits').insert([{ member_id, visitor_id: user.id, visit_date, notes: notes || null }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
