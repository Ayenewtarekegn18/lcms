import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, opt, text, date, time, count } from '@/lib/api/validation'

type EventRow = { event_date?: string | null; start_date?: string | null }

const createSchema = z
  .object({
    title: text(200),
    description: opt(z.string().trim().max(5000)),
    event_type: opt(z.string().trim().max(50)),
    event_date: date,
    event_time: opt(time),
    location: opt(z.string().trim().max(200)),
    max_attendees: opt(count),
  })
  .strict()

const day = (e: EventRow) => e.event_date || (e.start_date || '').split('T')[0]

export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const upcomingOnly = searchParams.get('upcoming') === 'true'

  const { data, error } = await auth.supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true })
    .limit(500)
  if (error) return dbError(error)

  const today = new Date().toISOString().split('T')[0]
  let events = (data ?? []) as EventRow[]
  if (upcomingOnly) events = events.filter((e) => day(e) >= today)
  events.sort((a, b) => day(a).localeCompare(day(b)))
  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { event_date, event_time } = body.data
  const { data, error } = await auth.supabase
    .from('events')
    .insert([{
      ...body.data,
      event_type: body.data.event_type ?? 'event',
      // start_date is NOT NULL; event_date/event_time are kept for display
      start_date: new Date(`${event_date}T${event_time || '00:00'}`).toISOString(),
      organizer_id: auth.user.id,
    }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
