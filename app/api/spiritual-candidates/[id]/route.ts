import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { data, error } = await supabase
    .from('spiritual_candidates')
    .select('*, member:profiles!member_id(id, first_name, last_name, email, phone), mentor:profiles!mentor_id(id, first_name, last_name)')
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: error?.message || 'Not found' }, { status: data ? 400 : 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const { status: st, mentor_id, progress_notes, joined_date, baptism_date } = body
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (st !== undefined) updates.status = st
  if (mentor_id !== undefined) updates.mentor_id = mentor_id
  if (progress_notes !== undefined) updates.progress_notes = progress_notes
  if (joined_date !== undefined) updates.joined_date = joined_date
  if (baptism_date !== undefined) updates.baptism_date = baptism_date
  const { data, error } = await supabase.from('spiritual_candidates').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await supabase.from('spiritual_candidates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
