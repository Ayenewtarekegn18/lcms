import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'
import { pageRange } from '@/lib/api/validation'
import { eventDays, type AttendanceEvent } from '@/lib/attendance'

/** Events up to this far ahead can be picked: attendance is taken at an event, not weeks before it. */
const AHEAD_MS = 7 * 24 * 60 * 60 * 1000

// Events to take attendance for, newest first, each with the days it takes attendance on.
// Cancelled events (is_active = false) are left out. ?limit=&offset= (default 100).
export async function GET(req: Request) {
  const auth = await requireRole(...PAGE_ACCESS.attendance)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  const { data, error } = await auth.supabase
    .from('events')
    .select('id, title, event_type, location, event_date, start_date, end_date')
    .not('is_active', 'is', false)
    .lte('start_date', new Date(Date.now() + AHEAD_MS).toISOString())
    .order('start_date', { ascending: false })
    .order('id')
    .range(...pageRange(searchParams, 100))
  if (error) return dbError(error)

  const events: AttendanceEvent[] = (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    event_type: e.event_type,
    location: e.location,
    ...eventDays(e),
  }))
  return NextResponse.json(events)
}
