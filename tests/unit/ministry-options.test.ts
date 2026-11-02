import { describe, expect, it } from 'vitest'
import { choiceLabel, choiceValues } from '@/lib/ministries/options'
import { EQUIPMENT_STATUSES, EQUIPMENT_STATUS_VALUES, WORSHIP_TYPE_VALUES } from '@/lib/ministries/stage-worship'
import { ENROLLMENT_STATUS_VALUES, MATERIAL_TYPE_VALUES, PROGRAM_TYPE_VALUES } from '@/lib/ministries/teaching'
import {
  educationEnrollmentUpdate,
  educationProgramCreate,
  educationProgramUpdate,
  worshipEquipmentCreate,
  worshipEventCreate,
  worshipTeamMemberUpdate,
} from '@/lib/api/schemas'

const ID = '00000000-0000-4000-8000-000000000001'

describe('choice lists', () => {
  it('lists the stored values in order', () => {
    expect(choiceValues([{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }])).toEqual(['a', 'b'])
    expect(EQUIPMENT_STATUS_VALUES).toEqual(['available', 'in_repair', 'retired'])
    expect(ENROLLMENT_STATUS_VALUES).toContain('active') // the column default
    expect(EQUIPMENT_STATUS_VALUES).toContain('available') // the column default
    expect(WORSHIP_TYPE_VALUES.length && PROGRAM_TYPE_VALUES.length && MATERIAL_TYPE_VALUES.length).toBeGreaterThan(0)
  })

  it('labels known values and shows unknown ones readably', () => {
    expect(choiceLabel(EQUIPMENT_STATUSES, 'in_repair')).toBe('In repair')
    expect(choiceLabel(EQUIPMENT_STATUSES, 'in_use')).toBe('In use')
    expect(choiceLabel(EQUIPMENT_STATUSES, 'NEEDS-SERVICE')).toBe('Needs service')
    expect(choiceLabel(EQUIPMENT_STATUSES, null)).toBeNull()
    expect(choiceLabel(EQUIPMENT_STATUSES, '')).toBeNull()
    expect(choiceLabel(EQUIPMENT_STATUSES, '__')).toBeNull()
  })
})

describe('worship and teaching schemas', () => {
  it('refuse server-owned or unknown keys and bad choices', () => {
    expect(worshipEventCreate.safeParse({ title: 'Sunday', event_date: '2030-01-06', id: ID }).success).toBe(false)
    expect(worshipEventCreate.safeParse({ title: 'Sunday', event_date: '2030-01-06T10:00:00Z' }).success).toBe(false)
    expect(worshipEventCreate.safeParse({ title: 'Sunday', event_date: '2030-01-06', worship_type: 'concert' }).success).toBe(false)
    expect(worshipEquipmentCreate.safeParse({ name: 'Mixer', status: 'in_use' }).success).toBe(false)
    expect(worshipEquipmentCreate.parse({ name: 'Mixer', status: '' })).toEqual({ name: 'Mixer', status: null })
  })

  it('keep the person and the parent of a membership fixed', () => {
    expect(worshipTeamMemberUpdate.safeParse({ role: 'Keyboard' }).success).toBe(true)
    expect(worshipTeamMemberUpdate.safeParse({ team_id: ID }).success).toBe(false)
    expect(educationEnrollmentUpdate.safeParse({ member_id: ID }).success).toBe(false)
    expect(educationEnrollmentUpdate.safeParse({ status: 'completed', completion_date: '2030-03-01', grade: 'A' }).success).toBe(true)
  })

  it('refuse a program that ends before it starts', () => {
    const program = { title: 'Foundations', start_date: '2030-02-01' }
    expect(educationProgramCreate.safeParse({ ...program, end_date: '2030-03-01' }).success).toBe(true)
    expect(educationProgramCreate.safeParse({ ...program, end_date: '2030-02-01' }).success).toBe(true)
    const early = educationProgramCreate.safeParse({ ...program, end_date: '2030-01-01' })
    expect(early.success).toBe(false)
    expect(early.error?.issues[0].path).toEqual(['end_date'])
    expect(educationProgramUpdate.safeParse({ end_date: '2030-01-01' }).success).toBe(true) // start unknown
    expect(educationProgramUpdate.safeParse({ start_date: '2030-02-01', end_date: null }).success).toBe(true)
    expect(educationProgramCreate.safeParse({ ...program, duration_weeks: 0 }).success).toBe(false)
  })
})
