import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'
import { pageRange, parseBody } from '@/lib/api/validation'
import { EVENT_SELECT, eventCreate, eventListQuery } from '@/lib/events/schema'

// Events with their ministry's name. Any signed-in user may read them (the calendar is open to every
// role, and events are member-readable under RLS). Query: see eventListQuery; ?limit=&offset= page.
export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const query = eventListQuery.safeParse(Object.fromEntries(searchParams))
  if (!query.success) {
    return NextResponse.json({ error: 'Invalid request', issues: z.flattenError(query.error) }, { status: 400 })
  }
  const { from, to, ascending } = query.data
  const [first, last] = pageRange(searchParams)

  let rows = auth.supabase.from('events').select(EVENT_SELECT).not('is_active', 'is', false)
  // from/to are ISO strings produced by toISOString(), so they hold no PostgREST filter syntax.
  // end_date >= start_date (CHECK), so "end or start >= from" means "still running at from".
  if (from) rows = rows.or(`end_date.gte.${from},start_date.gte.${from}`)
  if (to) rows = rows.lt('start_date', to)

  const { data, error } = await rows
    .order('start_date', { ascending })
    .order('id', { ascending: true })
    .range(first, last)
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

// Same roles as the events page and the staff write policies (RLS). The organizer is the signed-in
// user; the strict schema refuses organizer_id and any other field the server owns.
export async function POST(req: Request) {
  const auth = await requireRole(...PAGE_ACCESS.events)
  if (auth.error) return auth.error
  const body = await parseBody(req, eventCreate)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('events')
    .insert({ ...body.data, organizer_id: auth.user.id })
    .select(EVENT_SELECT)
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
