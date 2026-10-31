import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'
import { pageRange, parseBody } from '@/lib/api/validation'
import { RECORD_FIELDS, attendanceFilters, recordAttendance, toRecord, type AttendanceFilters } from '@/lib/api/attendance'
import { ATTENDANCE_STATUSES, eventDays, withinEvent, type AttendanceList } from '@/lib/attendance'

// Attendance per event on attendance_records (remediation step 2.5, finding F-21), for the roles that can
// open the attendance page: staff, the same roles row-level security lets read and write the table.

type Filterable<Q> = {
  eq(column: 'event_id' | 'member_id' | 'attendance_date' | 'status', value: string): Q
  gte(column: 'attendance_date', value: string): Q
  lte(column: 'attendance_date', value: string): Q
}

function filtered<Q extends Filterable<Q>>(query: Q, f: AttendanceFilters): Q {
  let q = query
  if (f.event_id) q = q.eq('event_id', f.event_id)
  if (f.member_id) q = q.eq('member_id', f.member_id)
  if (f.date) q = q.eq('attendance_date', f.date)
  if (f.from) q = q.gte('attendance_date', f.from)
  if (f.to) q = q.lte('attendance_date', f.to)
  if (f.status) q = q.eq('status', f.status)
  return q
}

// ?event_id=&member_id=&date=&from=&to=&status=&limit=&offset= → one page of records (newest first),
// how many match in all, and how many of those are present, absent or late (the per-event count).
export async function GET(req: Request) {
  const auth = await requireRole(...PAGE_ACCESS.attendance)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const parsed = attendanceFilters.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: z.flattenError(parsed.error) }, { status: 400 })
  }
  const filters = parsed.data
  const records = () => auth.supabase.from('attendance_records')

  const [list, ...tallies] = await Promise.all([
    filtered(records().select(RECORD_FIELDS, { count: 'exact' }), filters)
      .order('attendance_date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id')
      .range(...pageRange(searchParams, 50)),
    // the breakdown covers every status, whatever ?status= narrows the list to
    ...ATTENDANCE_STATUSES.map((status) =>
      filtered(records().select('id', { count: 'exact', head: true }), { ...filters, status })),
  ])
  const failed = [list, ...tallies].find((r) => r.error)?.error
  if (failed) return dbError(failed)

  const body: AttendanceList = {
    records: (list.data ?? []).map(toRecord),
    total: list.count ?? 0,
    counts: { present: tallies[0].count ?? 0, absent: tallies[1].count ?? 0, late: tallies[2].count ?? 0 },
  }
  return NextResponse.json(body)
}

// Record attendance for one or more members at an event: { event_id, attendance_date?, records: [{ member_id, status }] }.
// A member has one record per event and day (db/migrations/20261030000003_attendance_per_event.sql), so saving
// again changes the status. recorded_by_id is never sent: a new record gets the column default auth.uid(), the
// signed-in user, and a changed one keeps who first recorded it (every change is in the audit log).
export async function POST(req: Request) {
  const auth = await requireRole(...PAGE_ACCESS.attendance)
  if (auth.error) return auth.error
  const body = await parseBody(req, recordAttendance)
  if (body.error) return body.error
  const { event_id, attendance_date, records } = body.data

  const { data: event, error: eventError } = await auth.supabase
    .from('events')
    .select('id, event_type, event_date, start_date, end_date')
    .eq('id', event_id)
    .maybeSingle()
  if (eventError) return dbError(eventError)
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const days = eventDays(event)
  const day = attendance_date ?? days.first
  if (!withinEvent(day, days)) {
    return NextResponse.json({ error: 'The date is not one of the event’s days' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('attendance_records')
    .upsert(
      records.map((r) => ({ member_id: r.member_id, status: r.status, event_id, event_type: event.event_type, attendance_date: day })),
      { onConflict: 'event_id,attendance_date,member_id' },
    )
    .select(RECORD_FIELDS)
  if (error) return dbError(error)
  return NextResponse.json({ saved: data.length, records: data.map(toRecord) }, { status: 201 })
}
