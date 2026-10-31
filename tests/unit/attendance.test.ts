import { describe, expect, it } from 'vitest'
import {
  MAX_RECORDS_PER_SAVE, attendanceCorrection, attendanceFilters, nameFilter, recordAttendance, rosterQuery,
  toRecord, toRosterMember,
} from '@/lib/api/attendance'
import {
  applyMark, defaultDay, eventDays, formatDay, isAttendanceStatus, localDay, personName, withinEvent,
} from '@/lib/attendance'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const E = '33333333-3333-4333-8333-333333333333'

describe('eventDays', () => {
  it('uses event_date, else the date of start_date', () => {
    expect(eventDays({ event_date: '2026-11-01', start_date: '2026-10-31T22:00:00Z' })).toEqual({ first: '2026-11-01', last: '2026-11-01' })
    expect(eventDays({ event_date: null, start_date: '2026-11-01T08:00:00+00:00' })).toEqual({ first: '2026-11-01', last: '2026-11-01' })
  })
  it('runs to end_date for a multi-day event, never before the first day', () => {
    expect(eventDays({ start_date: '2026-11-01T08:00:00Z', end_date: '2026-11-03T17:00:00Z' })).toEqual({ first: '2026-11-01', last: '2026-11-03' })
    expect(eventDays({ start_date: '2026-11-05T08:00:00Z', end_date: '2026-11-03T17:00:00Z' })).toEqual({ first: '2026-11-05', last: '2026-11-05' })
  })
})

describe('withinEvent and defaultDay', () => {
  const days = { first: '2026-11-01', last: '2026-11-03' }
  it('accepts only the event days', () => {
    expect(withinEvent('2026-11-01', days)).toBe(true)
    expect(withinEvent('2026-11-03', days)).toBe(true)
    expect(withinEvent('2026-10-31', days)).toBe(false)
    expect(withinEvent('2026-11-04', days)).toBe(false)
  })
  it('opens on today while the event runs, otherwise on its first day', () => {
    expect(defaultDay(days, '2026-11-02')).toBe('2026-11-02')
    expect(defaultDay(days, '2026-12-01')).toBe('2026-11-01')
  })
})

describe('small helpers', () => {
  it('localDay formats the local date', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
  it('formatDay is readable and keeps bad input', () => {
    expect(formatDay('2026-10-30')).toBe('Fri, 30 Oct 2026')
    expect(formatDay('nope')).toBe('nope')
  })
  it('personName joins names and falls back to Unknown', () => {
    expect(personName({ first_name: 'Hana', last_name: 'Member' })).toBe('Hana Member')
    expect(personName({ first_name: 'Hana', last_name: null })).toBe('Hana')
    expect(personName(null)).toBe('Unknown')
  })
  it('isAttendanceStatus', () => {
    expect(isAttendanceStatus('late')).toBe(true)
    expect(isAttendanceStatus('excused')).toBe(false)
    expect(isAttendanceStatus(null)).toBe(false)
  })
})

describe('applyMark', () => {
  it('adds a change and drops it when it matches the saved status', () => {
    const one = applyMark({}, A, 'present', null)
    expect(one).toEqual({ [A]: 'present' })
    expect(applyMark(one, A, 'absent', 'absent')).toEqual({})
    expect(applyMark(one, B, 'late', 'present')).toEqual({ [A]: 'present', [B]: 'late' })
  })
  it('does not mutate its input', () => {
    const marks = Object.freeze({ [A]: 'present' as const })
    expect(() => applyMark(marks, A, 'absent', null)).not.toThrow()
    expect(marks).toEqual({ [A]: 'present' })
  })
})

describe('recordAttendance schema', () => {
  const ok = { event_id: E, records: [{ member_id: A, status: 'present' }] }
  it('accepts members and statuses for an event, with an optional day', () => {
    expect(recordAttendance.safeParse(ok).success).toBe(true)
    expect(recordAttendance.safeParse({ ...ok, attendance_date: '2026-11-01' }).success).toBe(true)
    expect(recordAttendance.safeParse({ ...ok, attendance_date: '' }).success).toBe(true)
  })
  it('refuses fields the server owns and unknown keys', () => {
    expect(recordAttendance.safeParse({ ...ok, recorded_by_id: A }).success).toBe(false)
    expect(recordAttendance.safeParse({ ...ok, records: [{ member_id: A, status: 'present', recorded_by_id: B }] }).success).toBe(false)
  })
  it('refuses bad ids, unknown statuses, empty, duplicate and oversized lists', () => {
    expect(recordAttendance.safeParse({ ...ok, event_id: 'x' }).success).toBe(false)
    expect(recordAttendance.safeParse({ ...ok, records: [{ member_id: 'x', status: 'present' }] }).success).toBe(false)
    expect(recordAttendance.safeParse({ ...ok, records: [{ member_id: A, status: 'excused' }] }).success).toBe(false)
    expect(recordAttendance.safeParse({ ...ok, records: [] }).success).toBe(false)
    expect(recordAttendance.safeParse({ ...ok, records: [{ member_id: A, status: 'present' }, { member_id: A, status: 'absent' }] }).success).toBe(false)
    const many = Array.from({ length: MAX_RECORDS_PER_SAVE + 1 }, (_, i) => ({
      member_id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      status: 'present',
    }))
    expect(recordAttendance.safeParse({ ...ok, records: many }).success).toBe(false)
  })
})

describe('other schemas', () => {
  it('a correction changes only status and notes', () => {
    expect(attendanceCorrection.safeParse({ status: 'late' }).success).toBe(true)
    expect(attendanceCorrection.safeParse({ notes: 'came at 10' }).success).toBe(true)
    expect(attendanceCorrection.safeParse({ member_id: A }).success).toBe(false)
    expect(attendanceCorrection.safeParse({ status: 'gone' }).success).toBe(false)
  })
  it('list filters validate ids, dates and status', () => {
    expect(attendanceFilters.safeParse({ event_id: E, date: '2026-11-01', status: 'absent', limit: '10' }).success).toBe(true)
    expect(attendanceFilters.safeParse({ event_id: 'nope' }).success).toBe(false)
    expect(attendanceFilters.safeParse({ from: '01/11/2026' }).success).toBe(false)
  })
  it('the roster needs an event and a day', () => {
    expect(rosterQuery.safeParse({ event_id: E, date: '2026-11-01' }).success).toBe(true)
    expect(rosterQuery.safeParse({ event_id: E }).success).toBe(false)
  })
})

describe('nameFilter', () => {
  it('matches one word in either name', () => {
    expect(nameFilter('hana')).toBe('first_name.ilike.%hana%,last_name.ilike.%hana%')
  })
  it('needs every word (up to three) to match', () => {
    expect(nameFilter('hana  member')).toBe(
      'and(or(first_name.ilike.%hana%,last_name.ilike.%hana%),or(first_name.ilike.%member%,last_name.ilike.%member%))',
    )
    expect(nameFilter('a b c d').match(/or\(/g)).toHaveLength(3)
  })
})

describe('response mapping', () => {
  it('toRecord flattens names and the event title', () => {
    expect(
      toRecord({
        id: A, member_id: B, event_id: E, attendance_date: '2026-11-01', status: 'present', notes: null, created_at: null,
        member: { first_name: 'Hana', last_name: 'Member' }, recorded_by: null, event: { title: 'Sunday service' },
      }),
    ).toEqual({
      id: A, member_id: B, member_name: 'Hana Member', event_id: E, event_title: 'Sunday service',
      attendance_date: '2026-11-01', status: 'present', notes: null, recorded_by_name: null, created_at: null,
    })
  })
  it('toRosterMember takes the member number and the saved record', () => {
    expect(
      toRosterMember({
        id: A, first_name: 'Hana', last_name: 'Member',
        member_details: [{ member_number: 'LKH-0001' }], attendance_records: [{ id: B, status: 'late' }],
      }),
    ).toEqual({ id: A, name: 'Hana Member', memberNumber: 'LKH-0001', record: { id: B, status: 'late' } })
    expect(
      toRosterMember({ id: A, first_name: 'Hana', last_name: null, member_details: null, attendance_records: [] }),
    ).toEqual({ id: A, name: 'Hana', memberNumber: null, record: null })
  })
})
