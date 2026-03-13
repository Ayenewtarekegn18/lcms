import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()

  let query = supabase
    .from('spiritual_classes')
    .select('*, instructor:profiles!instructor_id(id, first_name, last_name)')
    .order('class_date', { ascending: false })
  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  let list = rows || []
  if (search) {
    const s = search.toLowerCase()
    list = list.filter((r: { title?: string }) => (r.title || '').toLowerCase().includes(s))
  }
  return NextResponse.json(list)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, class_date, instructor_id, location, max_attendees } = body
  if (!title || !class_date) return NextResponse.json({ error: 'title and class_date required' }, { status: 400 })
  const { data, error } = await supabase
    .from('spiritual_classes')
    .insert([{ title, class_date, instructor_id: instructor_id || null, location: location || null, max_attendees: max_attendees || null }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
