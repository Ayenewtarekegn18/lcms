import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('admin_tasks').select('*, assigned_to:profiles!assigned_to_id(id, first_name, last_name)').order('due_date', { ascending: false, nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, assigned_to_id, due_date, notes, status } = body
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const { data, error } = await supabase.from('admin_tasks').insert([{ title, assigned_to_id: assigned_to_id || null, due_date: due_date || null, notes: notes || null, status: status || 'pending' }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
