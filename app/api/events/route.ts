import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const upcomingOnly = searchParams.get('upcoming') === 'true'

  let query = supabase.from('events').select('*')

  const { data: rawEvents, error } = await query
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  let events = rawEvents || []
  const hasEventDate = events.length > 0 && 'event_date' in events[0]
  if (hasEventDate && upcomingOnly) {
    const today = new Date().toISOString().split('T')[0]
    events = events.filter((e: { event_date?: string }) => (e.event_date || '') >= today)
  } else if (!hasEventDate && upcomingOnly) {
    const now = new Date().toISOString()
    events = events.filter((e: { start_date?: string }) => (e.start_date || '') >= now)
  }
  events.sort((a: { event_date?: string; start_date?: string }, b: { event_date?: string; start_date?: string }) => {
    const da = a.event_date || (a.start_date || '').split('T')[0]
    const db = b.event_date || (b.start_date || '').split('T')[0]
    return da.localeCompare(db)
  })

  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert([
      {
        title: body.title,
        description: body.description,
        event_type: body.event_type || 'event',
        event_date: body.event_date,
        event_time: body.event_time,
        location: body.location,
        organizer_id: user.id,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(event, { status: 201 })
}
