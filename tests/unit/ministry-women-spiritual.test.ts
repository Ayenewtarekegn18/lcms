import { describe, expect, it } from 'vitest'
import { shortTime, womenActivityStatusLabel } from '@/lib/ministries/women'
import {
  attendanceSummary, candidateStatusLabel, followUpStatusLabel, followUpTypeLabel,
} from '@/lib/ministries/spiritual-service'
import {
  baptismUpdate, spiritualCandidateUpdate, spiritualClassAttendanceCreate, spiritualClassAttendanceUpdate,
  spiritualFollowUpUpdate, womenActivityUpdate, womenMeetingUpdate,
} from '@/lib/api/schemas'

const ID = '00000000-0000-4000-8000-000000000001'

describe('women and spiritual service labels', () => {
  it('labels the stored values and leaves unknown ones out', () => {
    expect(womenActivityStatusLabel('planned')).toBe('Planned')
    expect(womenActivityStatusLabel('other')).toBeNull()
    expect(candidateStatusLabel('baptism_ready')).toBe('Baptism ready')
    expect(followUpTypeLabel('post_baptism')).toBe('Post-baptism')
    expect(followUpStatusLabel('completed')).toBe('Completed')
    expect(followUpStatusLabel(null)).toBeNull()
  })

  it('shortens times and summarises attendance', () => {
    expect(shortTime('18:30:00')).toBe('18:30')
    expect(shortTime(null)).toBeNull()
    expect(attendanceSummary(12, 20)).toBe('12 of 20')
    expect(attendanceSummary(3, null)).toBe('3')
    expect(attendanceSummary(0, 0)).toBe('0')
  })
})

describe('women and spiritual service schemas', () => {
  it('accept partial updates and refuse unknown keys', () => {
    expect(womenMeetingUpdate.safeParse({ minutes_text: 'Prayed together' }).success).toBe(true)
    expect(womenMeetingUpdate.safeParse({ created_at: '2030-01-01' }).success).toBe(false)
    expect(womenActivityUpdate.safeParse({ status: 'completed' }).success).toBe(true)
    expect(womenActivityUpdate.safeParse({ status: 'cancelled' }).success).toBe(false)
  })

  it('never let the person a record is about change', () => {
    for (const schema of [spiritualCandidateUpdate, baptismUpdate, spiritualFollowUpUpdate]) {
      expect(schema.safeParse({ member_id: ID }).success).toBe(false)
    }
    expect(spiritualCandidateUpdate.safeParse({ status: 'baptized', mentor_id: null }).success).toBe(true)
  })

  it('class attendance: one person in one class, present or absent', () => {
    expect(spiritualClassAttendanceCreate.safeParse({ class_id: ID, member_id: ID }).success).toBe(true)
    expect(spiritualClassAttendanceCreate.safeParse({ class_id: ID }).success).toBe(false)
    expect(spiritualClassAttendanceUpdate.safeParse({ attended: false }).success).toBe(true)
    expect(spiritualClassAttendanceUpdate.safeParse({ attended: false, class_id: ID }).success).toBe(false)
  })
})
