// Request schemas and response shapes of the attendance API (app/api/attendance/**). Route files may
// only export HTTP handlers, so they live here. The page uses the client-safe lib/attendance.ts instead.
import { z } from 'zod'
import { date, opt, uuid } from '@/lib/api/validation'
import {
  ATTENDANCE_STATUSES, personName, type AttendanceRecord, type Person, type RosterMember,
} from '@/lib/attendance'

/** Most records one save may carry: a long roster page fits, and the JSON stays well under the 64 KB cap. */
export const MAX_RECORDS_PER_SAVE = 500

export const attendanceStatus = z.enum(ATTENDANCE_STATUSES)

/**
 * POST /api/attendance: statuses for members at one event, on one of its days (default: its first day).
 * Everything else on the row (recorded_by_id, event_type) is the server's, never the request's.
 */
export const recordAttendance = z
  .object({
    event_id: uuid,
    attendance_date: opt(date),
    records: z
      .array(z.object({ member_id: uuid, status: attendanceStatus }).strict())
      .min(1)
      .max(MAX_RECORDS_PER_SAVE)
      .refine((rows) => new Set(rows.map((r) => r.member_id)).size === rows.length, {
        message: 'Each member can be marked once per save',
      }),
  })
  .strict()

/** PATCH /api/attendance/[id]: a correction to one saved record. Member, event and recorder stay as they are. */
export const attendanceCorrection = z
  .object({ status: attendanceStatus, notes: opt(z.string().trim().max(1000)) })
  .partial()
  .strict()

/** GET /api/attendance filters. limit and offset are read by pageRange(). */
export const attendanceFilters = z.object({
  event_id: uuid.optional(),
  member_id: uuid.optional(),
  date: date.optional(),
  from: date.optional(),
  to: date.optional(),
  status: attendanceStatus.optional(),
})
export type AttendanceFilters = z.infer<typeof attendanceFilters>

/** GET /api/attendance/members: the roster for one event and day. search, limit and offset are read separately. */
export const rosterQuery = z.object({ event_id: uuid, date })

/** A saved record with the member's and the recorder's names and the event's title. */
export const RECORD_FIELDS =
  'id, member_id, event_id, attendance_date, status, notes, created_at, member:profiles!attendance_records_member_id_fkey(first_name, last_name), recorded_by:profiles!attendance_records_recorded_by_id_fkey(first_name, last_name), event:events(title)'

type RecordRow = {
  id: string
  member_id: string
  event_id: string | null
  attendance_date: string
  status: string | null
  notes: string | null
  created_at: string | null
  member: Person
  recorded_by: Person
  event: { title: string } | null
}

export function toRecord(row: RecordRow): AttendanceRecord {
  return {
    id: row.id,
    member_id: row.member_id,
    member_name: personName(row.member),
    event_id: row.event_id,
    event_title: row.event?.title ?? null,
    attendance_date: row.attendance_date,
    status: row.status,
    notes: row.notes,
    recorded_by_name: row.recorded_by ? personName(row.recorded_by) : null,
    created_at: row.created_at,
  }
}

/** An active member with their number and their record for the event and day the route filters on. */
export const ROSTER_FIELDS =
  'id, first_name, last_name, member_details!member_details_member_id_fkey(member_number), attendance_records!attendance_records_member_id_fkey(id, status)'

type Details = { member_number: string }
type RosterRow = {
  id: string
  first_name: string | null
  last_name: string | null
  member_details: Details | Details[] | null
  attendance_records: { id: string; status: string | null }[] | null
}

export function toRosterMember(row: RosterRow): RosterMember {
  const details = Array.isArray(row.member_details) ? row.member_details[0] : row.member_details
  return {
    id: row.id,
    name: personName(row),
    memberNumber: details?.member_number ?? null,
    record: row.attendance_records?.[0] ?? null,
  }
}

/**
 * PostgREST filter for a name search: every word (up to three) must match the first or the last name.
 * `search` must come from cleanSearch(), which removes the characters that would break the filter.
 */
export function nameFilter(search: string) {
  const words = search.split(/\s+/).filter(Boolean).slice(0, 3)
  const either = (w: string) => `first_name.ilike.%${w}%,last_name.ilike.%${w}%`
  return words.length === 1 ? either(words[0]) : `and(${words.map((w) => `or(${either(w)})`).join(',')})`
}
