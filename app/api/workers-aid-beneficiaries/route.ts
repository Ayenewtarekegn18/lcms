import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('workers_aid_beneficiaries').select('*, member:profiles!member_id(id, first_name, last_name)').order('start_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { member_id, monthly_amount, start_date, notes } = body
  if (!member_id || monthly_amount == null) return NextResponse.json({ error: 'member_id and monthly_amount required' }, { status: 400 })
  const sd = start_date || new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase.from('workers_aid_beneficiaries').insert([{ member_id, monthly_amount, start_date: sd, notes: notes || null }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
