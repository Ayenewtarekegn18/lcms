import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()
  let query = supabase.from('women_meetings').select('*').order('meeting_date', { ascending: false })
  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  let list = rows || []
  if (search) list = list.filter((r: { title?: string }) => (r.title || '').toLowerCase().includes(search.toLowerCase()))
  return NextResponse.json(list)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, meeting_date, meeting_time, location, attendees_count, minutes_text } = body
  if (!title || !meeting_date) return NextResponse.json({ error: 'title and meeting_date required' }, { status: 400 })
  const { data, error } = await supabase
    .from('women_meetings')
    .insert([{ title, meeting_date, meeting_time: meeting_time || null, location: location || null, attendees_count: attendees_count ?? 0, minutes_text: minutes_text || null }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
