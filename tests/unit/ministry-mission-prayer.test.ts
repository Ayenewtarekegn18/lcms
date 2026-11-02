import { describe, expect, it } from 'vitest'
import { tripOptionLabel, tripStatusLabel } from '@/lib/ministries/mission'
import { normalizePrayerStatus, prayerStatusLabel } from '@/lib/ministries/prayer'
import {
  missionParticipantCreate,
  missionParticipantUpdate,
  missionReportCreate,
  missionTripCreate,
  missionTripUpdate,
  prayerGroupCreate,
  prayerRequestCreate,
  prayerRequestUpdate,
} from '@/lib/api/schemas'

const ID = '00000000-0000-4000-8000-000000000001'
const ID2 = '00000000-0000-4000-8000-000000000002'

describe('mission helpers', () => {
  it('labels trip statuses, reading an empty status as the column default', () => {
    expect(tripStatusLabel('ongoing')).toBe('Ongoing')
    expect(tripStatusLabel('cancelled')).toBe('Cancelled')
    expect(tripStatusLabel(null)).toBe('Planned')
    expect(tripStatusLabel('postponed')).toBe('postponed')
  })

  it('labels a trip in the picker with its date when it has one', () => {
    const fmt = (d: string) => `on ${d}`
    expect(tripOptionLabel({ title: 'Gondar outreach', trip_date: '2030-05-04' }, fmt)).toBe('Gondar outreach · on 2030-05-04')
    expect(tripOptionLabel({ title: 'Gondar outreach', trip_date: null }, fmt)).toBe('Gondar outreach')
  })
})

describe('prayer helpers', () => {
  it('reads older and empty statuses as open', () => {
    expect(normalizePrayerStatus('active')).toBe('open')
    expect(normalizePrayerStatus(null)).toBe('open')
    expect(normalizePrayerStatus('Answered')).toBe('answered')
    expect(prayerStatusLabel('closed')).toBe('Closed')
    expect(prayerStatusLabel('active')).toBe('Open')
  })
})

describe('mission schemas', () => {
  it('accepts a trip with a known status only', () => {
    expect(missionTripCreate.safeParse({ title: 'Trip', status: 'ongoing', trip_date: '2030-05-04' }).success).toBe(true)
    expect(missionTripCreate.safeParse({ title: 'Trip', status: 'done' }).success).toBe(false)
    expect(missionTripCreate.safeParse({ title: ' ' }).success).toBe(false)
    expect(missionTripUpdate.safeParse({ location: '' }).data).toEqual({ location: null })
  })

  it('never takes a participant’s trip or person on edit', () => {
    expect(missionParticipantCreate.safeParse({ trip_id: ID, member_id: ID2, role: 'Driver' }).success).toBe(true)
    expect(missionParticipantCreate.safeParse({ trip_id: ID }).success).toBe(false)
    expect(missionParticipantUpdate.safeParse({ role: 'Preacher' }).success).toBe(true)
    expect(missionParticipantUpdate.safeParse({ trip_id: ID }).success).toBe(false)
    expect(missionParticipantUpdate.safeParse({ member_id: ID }).success).toBe(false)
  })

  it('sets a report’s author on the server, not from the body', () => {
    expect(missionReportCreate.safeParse({ trip_id: ID, report_text: 'We visited 3 villages.' }).success).toBe(true)
    expect(missionReportCreate.safeParse({ trip_id: ID, report_text: 'x', created_by_id: ID2 }).success).toBe(false)
    expect(missionReportCreate.safeParse({ trip_id: 'nope', report_text: 'x' }).success).toBe(false)
  })
})

describe('prayer schemas', () => {
  it('opens a new request and never takes who asked from the body', () => {
    expect(prayerRequestCreate.parse({ request_text: 'For healing' })).toEqual({ request_text: 'For healing', status: 'open' })
    expect(prayerRequestCreate.safeParse({ request_text: 'x', requested_by_id: ID }).success).toBe(false)
    expect(prayerRequestCreate.safeParse({ request_text: 'x', status: 'active' }).success).toBe(false)
    expect(prayerRequestUpdate.safeParse({ status: 'answered', group_id: null }).success).toBe(true)
    expect(prayerRequestUpdate.safeParse({ status: null }).success).toBe(false)
  })

  it('needs a group name', () => {
    expect(prayerGroupCreate.safeParse({ name: 'Morning prayer', meeting_schedule: 'Daily 6 AM' }).success).toBe(true)
    expect(prayerGroupCreate.safeParse({ description: 'x' }).success).toBe(false)
  })
})
