import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { eventCreate, eventListQuery, eventUpdate, wallClock, type EventItem } from '@/lib/events/schema'
import {
  dayKey, endedBefore, eventDays, formatEventDate, formatEventTime, groupByDay, monthWindow, toFormParts, toInstant,
} from '@/lib/events/time'
import { emptyEventForm, eventToForm, formToPayload } from '@/lib/events/form'
import { failureReason } from '@/lib/events/client'

const MINISTRY = '00000000-0000-4000-8000-0000000000aa'
const base = { title: 'Sunday service', start_date: '2026-11-01T09:00:00+03:00' }
const spaces = (s: string) => s.replace(/\s+/g, ' ')

// Local-time helpers follow the process time zone, like the browser's; pin it per block.
const originalTz = process.env.TZ
const inZone = (tz: string) => {
  beforeAll(() => { process.env.TZ = tz })
  afterAll(() => { process.env.TZ = originalTz })
}

describe('eventCreate', () => {
  it('keeps event_date/event_time in step with the wall clock of start_date and defaults the type', () => {
    const out = eventCreate.parse({ ...base, ministry_id: MINISTRY, max_attendees: 150, description: '' })
    expect(out).toMatchObject({
      title: 'Sunday service', start_date: base.start_date, event_date: '2026-11-01', event_time: '09:00',
      event_type: 'Other', ministry_id: MINISTRY, max_attendees: 150, description: null,
    })
  })
  it('refuses fields the server owns and unknown keys', () => {
    for (const extra of [{ organizer_id: MINISTRY }, { is_active: false }, { id: MINISTRY }, { ministry: 'Choir' }, { event_date: '2026-11-01' }]) {
      expect(eventCreate.safeParse({ ...base, ...extra }).success, JSON.stringify(extra)).toBe(false)
    }
  })
  it('requires a title and a start instant with its offset', () => {
    expect(eventCreate.safeParse({ title: 'x' }).success).toBe(false)
    expect(eventCreate.safeParse({ ...base, title: '  ' }).success).toBe(false)
    for (const start_date of ['2026-11-01', '2026-11-01T09:00:00', '2026-11-01 09:00', '', null]) {
      expect(eventCreate.safeParse({ ...base, start_date }).success, String(start_date)).toBe(false)
    }
    expect(eventCreate.safeParse({ ...base, start_date: '2026-11-01T06:00:00.000Z' }).success).toBe(true)
  })
  it('refuses an end before the start, on the end_date field', () => {
    const bad = eventCreate.safeParse({ ...base, end_date: '2026-11-01T08:59:00+03:00' })
    expect(bad.success).toBe(false)
    expect(bad.error?.issues[0].path).toEqual(['end_date'])
    expect(eventCreate.safeParse({ ...base, end_date: base.start_date }).success).toBe(true)
    // same instant written in another offset is not "before"
    expect(eventCreate.safeParse({ ...base, end_date: '2026-11-01T06:00:00Z' }).success).toBe(true)
  })
  it('checks the ministry id, the attendee limit and the lengths', () => {
    expect(eventCreate.safeParse({ ...base, ministry_id: 'Choir' }).success).toBe(false)
    expect(eventCreate.safeParse({ ...base, ministry_id: '' }).data?.ministry_id).toBeNull()
    for (const max_attendees of [0, -1, 1.5, '20', 100_001]) {
      expect(eventCreate.safeParse({ ...base, max_attendees }).success, String(max_attendees)).toBe(false)
    }
    expect(eventCreate.safeParse({ ...base, title: 'x'.repeat(201) }).success).toBe(false)
    expect(eventCreate.safeParse({ ...base, location: 'x'.repeat(201) }).success).toBe(false)
  })
})

describe('eventUpdate', () => {
  it('takes any subset and refreshes the display columns only when the start changes', () => {
    expect(eventUpdate.parse({ location: 'Main hall' })).toEqual({ location: 'Main hall' })
    expect(eventUpdate.parse({ start_date: '2026-12-24T18:30:00+03:00' })).toEqual({
      start_date: '2026-12-24T18:30:00+03:00', event_date: '2026-12-24', event_time: '18:30',
    })
    expect(eventUpdate.parse({ ministry_id: null, end_date: '' })).toEqual({ ministry_id: null, end_date: null })
  })
  it("can't empty the NOT NULL columns or set server-owned ones", () => {
    for (const body of [{ title: null }, { title: '' }, { start_date: null }, { event_type: '' }, { organizer_id: MINISTRY }, { is_active: true }]) {
      expect(eventUpdate.safeParse(body).success, JSON.stringify(body)).toBe(false)
    }
  })
})

describe('wallClock', () => {
  it('reads the date and time as written, in the string’s own offset', () => {
    expect(wallClock('2026-11-01T23:30:00-05:00')).toEqual({ event_date: '2026-11-01', event_time: '23:30' })
    expect(wallClock('nope')).toBeNull()
  })
})

describe('eventListQuery', () => {
  afterEach(() => { vi.useRealTimers() })

  it('normalises the window to UTC instants; soonest first when there is a lower bound', () => {
    expect(eventListQuery.parse({ from: '2026-10-01T00:00:00+03:00', to: '2026-11-01' })).toEqual({
      from: '2026-09-30T21:00:00.000Z', to: '2026-11-01T00:00:00.000Z', ascending: true,
    })
    expect(eventListQuery.parse({})).toEqual({ from: undefined, to: undefined, ascending: false })
    expect(eventListQuery.parse({ to: '2026-11-01', order: 'desc' }).ascending).toBe(false)
    expect(eventListQuery.parse({ from: '2026-11-01', order: 'desc' }).ascending).toBe(false)
  })
  it('keeps upcoming=true for older callers: from the start of today (UTC)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-30T15:45:00Z'))
    expect(eventListQuery.parse({ upcoming: 'true' })).toMatchObject({ from: '2026-10-30T00:00:00.000Z', ascending: true })
    expect(eventListQuery.parse({ upcoming: 'true', from: '2026-12-01' }).from).toBe('2026-12-01T00:00:00.000Z')
  })
  it('refuses anything that is not a date or an instant, so nothing else reaches a filter', () => {
    for (const from of ['yesterday', '2026-13-01', '2026-10-01T00:00:00Z,id.eq.1', '2026-10-01)']) {
      expect(eventListQuery.safeParse({ from }).success, from).toBe(false)
    }
    expect(eventListQuery.safeParse({ order: 'sideways' }).success).toBe(false)
  })
})

describe('local times (Addis Ababa, UTC+3)', () => {
  inZone('Africa/Addis_Ababa')

  it('builds the instant with the user’s offset from the date and time inputs', () => {
    expect(toInstant('2026-11-01', '09:00')).toBe('2026-11-01T09:00:00+03:00')
    expect(toInstant('2026-11-01', '00:00')).toBe('2026-11-01T00:00:00+03:00')
    for (const [d, t] of [['2026-02-31', '09:00'], ['', '09:00'], ['2026-11-01', ''], ['2026-11-01', '24:00'], ['01/11/2026', '09:00']]) {
      expect(toInstant(d, t), `${d} ${t}`).toBeNull()
    }
  })
  it('splits an instant back into the form’s local date and time', () => {
    expect(toFormParts('2026-11-01T06:00:00.000Z')).toEqual({ date: '2026-11-01', time: '09:00' })
    expect(toFormParts('2026-10-31T22:30:00Z')).toEqual({ date: '2026-11-01', time: '01:30' })
    expect(toFormParts(null)).toEqual({ date: '', time: '' })
  })
  it('asks for a local calendar month', () => {
    expect(monthWindow(new Date(2026, 9, 17))).toEqual({ from: '2026-09-30T21:00:00.000Z', to: '2026-10-31T21:00:00.000Z' })
  })
  it('puts an event on every local day it covers', () => {
    expect(eventDays('2026-11-01T06:00:00Z')).toEqual(['2026-11-01'])
    expect(eventDays('2026-10-31T22:00:00Z')).toEqual(['2026-11-01']) // 01:00 local
    expect(eventDays('2026-11-21T09:00:00+03:00', '2026-11-22T17:00:00+03:00')).toEqual(['2026-11-21', '2026-11-22'])
    expect(eventDays('2026-11-21T20:00:00+03:00', '2026-11-22T00:00:00+03:00')).toEqual(['2026-11-21']) // ends at midnight
    expect(eventDays('2026-11-21T09:00:00+03:00', '2026-11-20T09:00:00+03:00')).toEqual(['2026-11-21']) // bad end
    expect(eventDays('2026-11-01T09:00:00+03:00', '2027-11-01T09:00:00+03:00', 5)).toHaveLength(5)
    expect(eventDays('not a date')).toEqual([])
  })
  it('groups the month’s events by day and tells past from running events', () => {
    const service = { id: 'a', start_date: '2026-11-01T09:00:00+03:00', end_date: null }
    const conference = { id: 'b', start_date: '2026-10-31T09:00:00+03:00', end_date: '2026-11-01T17:00:00+03:00' }
    const days = groupByDay([conference, service])
    expect(days.get('2026-10-31')?.map((e) => e.id)).toEqual(['b'])
    expect(days.get('2026-11-01')?.map((e) => e.id)).toEqual(['b', 'a'])
    expect(endedBefore([conference, service], '2026-11-01T00:00:00+03:00')).toEqual([])
    expect(endedBefore([conference, service], '2026-11-02T00:00:00+03:00')).toHaveLength(2)
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('local times (New York, daylight saving)', () => {
  inZone('America/New_York')

  it('uses the offset in force on that day', () => {
    expect(toInstant('2026-07-01', '09:00')).toBe('2026-07-01T09:00:00-04:00')
    expect(toInstant('2026-11-02', '09:00')).toBe('2026-11-02T09:00:00-05:00')
    expect(toInstant('2026-03-08', '02:30')).toBe('2026-03-08T03:30:00-04:00') // skipped hour moves forward
  })
})

describe('formatting', () => {
  const o = { locale: 'en-US', timeZone: 'Africa/Addis_Ababa' }
  it('shows dates and times in the given locale and zone', () => {
    expect(formatEventDate('2026-11-01T06:00:00Z', o)).toBe('Sun, Nov 1, 2026')
    expect(spaces(formatEventTime('2026-11-01T06:00:00Z', null, o))).toBe('9:00 AM')
    expect(spaces(formatEventTime('2026-11-01T09:00:00+03:00', '2026-11-01T11:00:00+03:00', o))).toBe('9:00 – 11:00 AM')
    expect(spaces(formatEventTime('2026-11-21T09:00:00+03:00', '2026-11-22T17:00:00+03:00', o))).toBe('Nov 21, 9:00 AM – Nov 22, 5:00 PM')
    expect(spaces(formatEventTime('2026-11-01T06:00:00Z', '2026-11-01T06:00:00Z', o))).toBe('9:00 AM')
    expect(formatEventDate('garbage', o)).toBe('')
  })
})

describe('event form', () => {
  inZone('Africa/Addis_Ababa')
  const filled = { ...emptyEventForm('2026-11-01'), title: '  Choir rehearsal ', ministry_id: MINISTRY, location: 'Main hall' }

  it('turns the inputs into the API payload', () => {
    const { payload, errors } = formToPayload({ ...filled, end_time: '11:00', max_attendees: '40' })
    expect(errors).toBeNull()
    expect(payload).toEqual({
      title: 'Choir rehearsal', event_type: 'Service', start_date: '2026-11-01T09:00:00+03:00',
      end_date: '2026-11-01T11:00:00+03:00', location: 'Main hall', ministry_id: MINISTRY, max_attendees: 40, description: null,
    })
    expect(eventCreate.safeParse(payload).success).toBe(true)
  })
  it('explains what to fix, next to the right field', () => {
    expect(formToPayload({ ...filled, title: ' ' }).errors).toEqual({ title: 'Enter a title (at most 200 characters)' })
    expect(formToPayload({ ...filled, date: '', time: '' }).errors).toEqual({ date: 'Choose a date', time: 'Choose a start time' })
    expect(formToPayload({ ...filled, end_date: '2026-11-02' }).errors).toEqual({ end_time: 'Choose an end time' })
    expect(formToPayload({ ...filled, end_time: '08:00' }).errors).toEqual({ end_time: "The end can't be before the start" })
    expect(formToPayload({ ...filled, max_attendees: '12abc' }).errors).toEqual({ max_attendees: 'Enter a whole number' })
    expect(formToPayload({ ...filled, max_attendees: '0' }).errors).toEqual({ max_attendees: 'Enter a whole number from 1 to 100,000' })
  })
  it('loads an event back into the form in local time', () => {
    const event = {
      id: 'e1', title: 'Youth conference', event_type: 'Conference', start_date: '2026-11-21T06:00:00Z', end_date: '2026-11-22T14:00:00Z',
      location: null, ministry_id: MINISTRY, max_attendees: 150, description: 'Two days', ministry: { id: MINISTRY, name: 'Youth' },
    } as EventItem
    const form = eventToForm(event)
    expect(form).toMatchObject({ date: '2026-11-21', time: '09:00', end_date: '2026-11-22', end_time: '17:00', max_attendees: '150', location: '' })
    expect(formToPayload(form).payload).toMatchObject({ start_date: '2026-11-21T09:00:00+03:00', end_date: '2026-11-22T17:00:00+03:00' })
    expect(eventToForm({ ...event, end_date: '2026-11-21T08:00:00Z' })).toMatchObject({ end_date: '', end_time: '11:00' })
  })
})

describe('failureReason', () => {
  it('says what went wrong in words a person can act on', () => {
    expect(failureReason(403, { error: 'Forbidden' })).toBe('Your role is not allowed to do this.')
    expect(failureReason(400, { error: 'Invalid request', issues: { fieldErrors: { end_date: ["The end can't be before the start"] } } }))
      .toBe("The end can't be before the start")
    expect(failureReason(400, { error: 'Invalid data' })).toBe('Some details are not valid.')
    expect(failureReason(500, null)).toBe('The server had a problem. Try again in a moment.')
  })
})
