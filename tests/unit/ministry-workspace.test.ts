import { describe, expect, it } from 'vitest'
import { leaderList, meetingLabel, ministryRoleLabel, normalizeMinistryRole } from '@/lib/ministries/workspace'
import { choirMemberUpdate, choirScheduleCreate, choirSongCreate, ministryMembershipCreate, ministryMembershipUpdate } from '@/lib/api/schemas'

const ID = '00000000-0000-4000-8000-000000000001'
const person = (id: string, first_name: string) => ({ id, first_name, last_name: 'Test' })

describe('ministry roles', () => {
  it('maps older spellings onto leader, co_leader and member', () => {
    expect(normalizeMinistryRole('Leader')).toBe('leader')
    expect(normalizeMinistryRole('Co-Leader')).toBe('co_leader')
    expect(normalizeMinistryRole('co leader')).toBe('co_leader')
    expect(normalizeMinistryRole('Member')).toBe('member')
    expect(normalizeMinistryRole('Coordinator')).toBe('member')
    expect(normalizeMinistryRole(null)).toBe('member')
    expect(ministryRoleLabel('co_leader')).toBe('Co-leader')
  })
})

describe('leaderList', () => {
  it("puts the ministry's own leader first, then leaders, then co-leaders, without duplicates or members", () => {
    const list = leaderList(person('a', 'Abeba'), [
      { role: 'co_leader', member: person('c', 'Chala') },
      { role: 'member', member: person('d', 'Dawit') },
      { role: 'leader', member: person('a', 'Abeba') },
      { role: 'leader', member: person('b', 'Bethel') },
      { role: 'leader', member: null },
    ])
    expect(list).toEqual([
      { member_id: 'a', name: 'Abeba Test', role: 'leader' },
      { member_id: 'b', name: 'Bethel Test', role: 'leader' },
      { member_id: 'c', name: 'Chala Test', role: 'co_leader' },
    ])
  })
})

describe('meetingLabel', () => {
  it('joins day and time and is null when neither is set', () => {
    expect(meetingLabel({ meeting_day: 'Saturday', meeting_time: '15:00' })).toBe('Saturday · 15:00')
    expect(meetingLabel({ meeting_day: 'Friday', meeting_time: ' ' })).toBe('Friday')
    expect(meetingLabel({ meeting_day: null, meeting_time: null })).toBeNull()
  })
})

describe('ministry workspace schemas', () => {
  it('adds a member with role member unless another is given', () => {
    expect(ministryMembershipCreate.parse({ ministry_id: ID, member_id: ID })).toMatchObject({ role: 'member' })
    expect(ministryMembershipCreate.parse({ ministry_id: ID, member_id: ID, role: 'Co-Leader' })).toMatchObject({ role: 'co_leader' })
    expect(ministryMembershipCreate.safeParse({ ministry_id: ID, member_id: ID, role: 'admin' }).success).toBe(false)
    expect(ministryMembershipCreate.safeParse({ ministry_id: ID, member_id: ID, is_active: false }).success).toBe(false)
    expect(ministryMembershipUpdate.parse({ role: 'leader' })).toEqual({ role: 'leader' })
  })
  it('keeps choir rows to their own fields', () => {
    expect(choirSongCreate.parse({ title: ' Song ', composer: '' })).toEqual({ title: 'Song', composer: null })
    expect(choirSongCreate.safeParse({ title: 'x', lyrics_url: 'not a url' }).success).toBe(false)
    expect(choirScheduleCreate.safeParse({ event_date: '2026-11-07', event_type: 'concert' }).success).toBe(false)
    expect(choirScheduleCreate.parse({ event_date: '2026-11-07', event_type: 'rehearsal' })).toMatchObject({ event_type: 'rehearsal' })
    expect(choirMemberUpdate.safeParse({ member_id: ID }).success).toBe(false) // the singer can't change
    expect(choirMemberUpdate.parse({ voice_part: 'Alto', is_active: false })).toEqual({ voice_part: 'Alto', is_active: false })
  })
})
