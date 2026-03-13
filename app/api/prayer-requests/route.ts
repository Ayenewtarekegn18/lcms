import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const group_id = searchParams.get('group_id')
  let query = supabase.from('prayer_requests').select('*, requested_by:profiles!requested_by_id(id, first_name, last_name)').order('created_at', { ascending: false })
  if (group_id) query = query.eq('group_id', group_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { group_id, request_text, status } = body
  if (!request_text) return NextResponse.json({ error: 'request_text required' }, { status: 400 })
  const { data, error } = await supabase.from('prayer_requests').insert([{ group_id: group_id || null, requested_by_id: user.id, request_text, status: status || 'active' }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
