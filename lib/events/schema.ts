import { z } from 'zod'
import type { Tables } from '@/lib/database.types'
import { opt, text, uuid } from '@/lib/api/validation'

// One definition of an event for the events API, the events page and the calendar (finding F-19).
// start_date (timestamptz, NOT NULL) is the source of time. event_date/event_time are older display
// columns that other pages still read, so they are kept in step with start_date.

/** An instant with its UTC offset, e.g. 2026-11-01T09:00:00+03:00 (what the forms send) or …Z. */
export const instant = z.iso.datetime({ offset: true })

/** Suggested types for the form; the column is free text, so older values still show. */
export const EVENT_TYPES = ['Service', 'Bible study', 'Prayer', 'Rehearsal', 'Meeting', 'Conference', 'Outreach', 'Fellowship', 'Other'] as const
export const DEFAULT_EVENT_TYPE = 'Other'

/** The columns the API returns: every event column plus its ministry's id and name (a join). */
export const EVENT_SELECT = '*, ministry:ministries(id, name)' as const
export type EventItem = Tables<'events'> & { ministry: Pick<Tables<'ministries'>, 'id' | 'name'> | null }

// Fields a client may set. organizer_id, is_active and the timestamps are not among them: the
// organizer comes from the session, and the strict schemas below reject unknown keys.
const fields = {
  title: text(200),
  description: opt(z.string().trim().max(5000)),
  event_type: text(50).optional(),
  start_date: instant,
  end_date: opt(instant),
  location: opt(z.string().trim().max(200)),
  max_attendees: opt(z.number().int().min(1).max(100_000)),
  ministry_id: opt(uuid),
}

// Same rule as the events_end_after_start CHECK, reported on the field instead of as "Invalid data".
const endNotBeforeStart = (v: { start_date?: string; end_date?: string | null }) =>
  !v.start_date || !v.end_date || Date.parse(v.end_date) >= Date.parse(v.start_date)
const endIssue = { path: ['end_date'], message: "The end can't be before the start" }

const WALL_CLOCK = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/

/**
 * The date and time as written in an ISO date-time, in its own offset:
 * '2026-11-01T09:00:00+03:00' → { event_date: '2026-11-01', event_time: '09:00' }.
 */
export function wallClock(iso: string) {
  const m = WALL_CLOCK.exec(iso)
  return m ? { event_date: m[1], event_time: m[2] } : null
}

/** Keep the display columns in step whenever start_date is written. */
function withDisplayColumns<T extends { start_date?: string }>(v: T) {
  const wall = v.start_date ? wallClock(v.start_date) : null
  return wall ? { ...v, ...wall } : v
}

/** POST /api/events */
export const eventCreate = z
  .object(fields)
  .strict()
  .refine(endNotBeforeStart, endIssue)
  .transform((v) => ({ ...withDisplayColumns(v), event_type: v.event_type ?? DEFAULT_EVENT_TYPE }))

/** PATCH /api/events/[id]: any subset of the fields; title, type and start can't be emptied. */
export const eventUpdate = z
  .object(fields)
  .partial()
  .strict()
  .refine(endNotBeforeStart, endIssue)
  .transform(withDisplayColumns)

export type EventPayload = z.input<typeof eventCreate>

const queryInstant = z.union([instant, z.iso.date()]).transform((v) => new Date(v).toISOString())

/**
 * GET /api/events query. Like a calendar API's time window:
 *  - from: events still running at or after it (end, or start when there is no end, >= from)
 *  - to:   events starting before it (start < to)
 *  - upcoming=true: from the start of today (UTC), for callers that don't send `from`
 *  - order: by start; soonest first when there is a lower bound, newest first otherwise
 */
export const eventListQuery = z
  .object({
    from: queryInstant.optional(),
    to: queryInstant.optional(),
    upcoming: z.enum(['true', 'false']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  })
  .transform(({ from, to, upcoming, order }) => {
    const since = from ?? (upcoming === 'true' ? `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z` : undefined)
    return { from: since, to, ascending: (order ?? (since ? 'asc' : 'desc')) === 'asc' }
  })
