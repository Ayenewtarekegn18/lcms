// Event times in the user's own time zone and locale (the browser's). Forms take a local date and
// time; the API stores the instant (start_date, timestamptz) with the offset the browser sent.

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

/** A Date's local calendar day, 'YYYY-MM-DD'. */
export function dayKey(d: Date) {
  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 'YYYY-MM-DD' → local midnight of that day. */
export function fromDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(2000, 0, 1)
  date.setFullYear(y, m - 1, d)
  return date
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

/** The calendar's request window for a month: its first instant and the next month's first instant. */
export function monthWindow(month: Date) {
  return {
    from: new Date(month.getFullYear(), month.getMonth(), 1).toISOString(),
    to: new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString(),
  }
}

/**
 * A form's local date ('YYYY-MM-DD') and time ('HH:MM') → an ISO date-time with the user's UTC offset
 * at that moment, e.g. '2026-11-01T09:00:00+03:00'. null when either is missing or isn't a real date.
 * (A time skipped by a daylight-saving change moves forward, as the browser does.)
 */
export function toInstant(date: string, time: string): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const t = /^(\d{2}):(\d{2})$/.exec(time)
  if (!d || !t || +t[1] > 23 || +t[2] > 59) return null
  const local = fromDayKey(date)
  if (local.getFullYear() !== +d[1] || local.getMonth() !== +d[2] - 1 || local.getDate() !== +d[3]) return null // 31 February
  local.setHours(+t[1], +t[2], 0, 0)
  const offset = -local.getTimezoneOffset()
  const abs = Math.abs(offset)
  const zone = `${offset < 0 ? '-' : '+'}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  return `${dayKey(local)}T${pad(local.getHours())}:${pad(local.getMinutes())}:00${zone}`
}

/** An ISO instant → the form's local date and time in the user's time zone ('' when missing). */
export function toFormParts(iso: string | null | undefined) {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return { date: '', time: '' }
  return { date: dayKey(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
}

/**
 * The local days ('YYYY-MM-DD') an event covers, from its start day to its end day. An end at exactly
 * midnight doesn't spill onto the next day. At most `max` days, so a wrong end date can't flood the grid.
 */
export function eventDays(start: string, end?: string | null, max = 62): string[] {
  const s = new Date(start)
  if (Number.isNaN(s.getTime())) return []
  let e = end ? new Date(end) : s
  if (Number.isNaN(e.getTime()) || e < s) e = s
  if (e > s && e.getTime() === startOfDay(e).getTime()) e = new Date(e.getTime() - 1)
  const last = dayKey(e)
  const days: string[] = []
  for (const cursor = startOfDay(s); days.length < max; cursor.setDate(cursor.getDate() + 1)) {
    const key = dayKey(cursor)
    days.push(key)
    if (key >= last) break
  }
  return days
}

/** Events by the local days they cover, each day's list in the order given. */
export function groupByDay<T extends { start_date: string; end_date?: string | null }>(events: T[]) {
  const days = new Map<string, T[]>()
  for (const event of events) {
    for (const key of eventDays(event.start_date, event.end_date)) {
      const list = days.get(key)
      if (list) list.push(event)
      else days.set(key, [event])
    }
  }
  return days
}

/** Events in `list` that ended before `instant` (they started before it and aren't still running). */
export function endedBefore<T extends { start_date: string; end_date?: string | null }>(list: T[], instant: string) {
  const limit = Date.parse(instant)
  return list.filter((e) => Date.parse(e.end_date ?? e.start_date) < limit)
}

/** Locale and time zone for display; both default to the user's own. Tests pass fixed ones. */
export type DisplayOptions = { locale?: string; timeZone?: string }

const valid = (d: Date) => !Number.isNaN(d.getTime())

/** 'Sun, Nov 1, 2026' */
export function formatEventDate(iso: string, o: DisplayOptions = {}) {
  const d = new Date(iso)
  if (!valid(d)) return ''
  return new Intl.DateTimeFormat(o.locale, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: o.timeZone }).format(d)
}

/** '9:00 AM', '9:00 – 11:00 AM', or 'Nov 21, 9:00 AM – Nov 22, 5:00 PM' when the event spans days. */
export function formatEventTime(start: string, end?: string | null, o: DisplayOptions = {}) {
  const s = new Date(start)
  if (!valid(s)) return ''
  const time: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', timeZone: o.timeZone }
  const e = end ? new Date(end) : null
  if (!e || !valid(e) || e <= s) return new Intl.DateTimeFormat(o.locale, time).format(s)
  const day = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: o.timeZone })
  const sameDay = day.format(s) === day.format(e)
  return new Intl.DateTimeFormat(o.locale, sameDay ? time : { ...time, month: 'short', day: 'numeric' }).formatRange(s, e)
}

/** 'Friday, October 30, 2026' */
export function formatDayLabel(d: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(d)
}

/** 'October 2026' */
export function formatMonth(month: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)
}

/** Short weekday names, Sunday first. */
export function weekdayNames(locale?: string) {
  const f = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2026, 1, 1 + i))) // 1 Feb 2026 was a Sunday
}
