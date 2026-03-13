import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()
  let query = supabase.from('women_trainings').select('*').order('training_date', { ascending: false, nullsFirst: false })
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
  const { title, training_date, instructor_name, description, registered_count } = body
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const { data, error } = await supabase
    .from('women_trainings')
    .insert([{ title, training_date: training_date || null, instructor_name: instructor_name || null, description: description || null, registered_count: registered_count ?? 0 }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
