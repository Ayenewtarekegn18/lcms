// Attendance per event (remediation step 2.5, finding F-21): the statuses staff record, the days an event
// takes attendance on, and the shapes the attendance API returns. Client-safe (no server imports): the API
// routes (app/api/attendance/**) and the attendance page share it.

/** The statuses the attendance page offers and the API accepts (attendance_records.status). */
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late'] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const STATUS_LABELS: Record<AttendanceStatus, string> = { present: 'Present', absent: 'Absent', late: 'Late' }

export const isAttendanceStatus = (value: unknown): value is AttendanceStatus =>
  (ATTENDANCE_STATUSES as readonly unknown[]).includes(value)

/** The event columns that decide which days it takes attendance on. */
export type EventTimes = { event_date?: string | null; start_date: string; end_date?: string | null }
export type EventDays = { first: string; last: string }

/**
 * First and last day (YYYY-MM-DD) of an event. Its day follows /api/events: event_date, else the date of
 * start_date. A multi-day event runs to the date of end_date.
 */
export function eventDays(event: EventTimes): EventDays {
  const first = event.event_date || event.start_date.slice(0, 10)
  const end = event.end_date?.slice(0, 10) ?? first
  return { first, last: end > first ? end : first }
}

export function withinEvent(day: string, days: EventDays) {
  return day >= days.first && day <= days.last
}

/** The day to open an event on: today while a multi-day event is running, otherwise its first day. */
export function defaultDay(days: EventDays, today: string) {
  return withinEvent(today, days) ? today : days.first
}

/** Today (YYYY-MM-DD) on this device's clock. */
export function localDay(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** '2026-10-30' → 'Fri, 30 Oct 2026' */
export function formatDay(day: string) {
  const d = new Date(`${day}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? day : dayFormat.format(d)
}

export type Person = { first_name: string | null; last_name: string | null } | null | undefined

export function personName(person: Person) {
  return [person?.first_name, person?.last_name].filter(Boolean).join(' ').trim() || 'Unknown'
}

/**
 * Unsaved marks after a click on a status. Marking the status that is already saved is no change,
 * so that member drops out of the marks the Save button sends.
 */
export function applyMark(
  marks: Readonly<Record<string, AttendanceStatus>>,
  memberId: string,
  status: AttendanceStatus,
  saved: string | null | undefined,
) {
  const next = { ...marks }
  if (saved === status) delete next[memberId]
  else next[memberId] = status
  return next
}

/** An event as GET /api/attendance/events returns it. */
export type AttendanceEvent = EventDays & { id: string; title: string; event_type: string; location: string | null }

/** A member on the roster, with their saved record for the chosen event and day, if there is one. */
export type RosterMember = {
  id: string
  name: string
  memberNumber: string | null
  record: { id: string; status: string | null } | null
}

/** A saved record as GET /api/attendance returns it. */
export type AttendanceRecord = {
  id: string
  member_id: string
  member_name: string
  event_id: string | null
  event_title: string | null
  attendance_date: string
  status: string | null
  notes: string | null
  recorded_by_name: string | null
  created_at: string | null
}

export type AttendanceCounts = Record<AttendanceStatus, number>

/** GET /api/attendance: one page of records, how many match in all, and the matches per status. */
export type AttendanceList = { records: AttendanceRecord[]; total: number; counts: AttendanceCounts }
