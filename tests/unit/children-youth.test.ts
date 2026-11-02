import { describe, expect, it } from 'vitest'
import { buildRegister, localToday, registerCounts, teacherRoleLabel, type AttendanceRow } from '@/lib/ministries/children'
import { programTypeLabel } from '@/lib/ministries/youth'
import {
  childrenAttendanceCreate,
  childrenAttendanceUpdate,
  childrenTeacherCreate,
  childrenTeacherUpdate,
  youthMentorshipCreate,
  youthMentorshipUpdate,
  youthProgramCreate,
} from '@/lib/api/schemas'

const CLASS = '00000000-0000-4000-8000-0000000000c1'
const OTHER = '00000000-0000-4000-8000-0000000000c2'
const A = '00000000-0000-4000-8000-00000000000a'
const B = '00000000-0000-4000-8000-00000000000b'
const C = '00000000-0000-4000-8000-00000000000c'
const person = (id: string, first_name: string) => ({ id, first_name, last_name: 'Child' })

let n = 0
const row = (member: ReturnType<typeof person>, attendance_date: string, status = 'present', class_id = CLASS): AttendanceRow => ({
  id: `row-${++n}`, class_id, member_id: member.id, attendance_date, status, member,
})

describe('buildRegister', () => {
  const abel = person(A, 'Abel')
  const bethel = person(B, 'Bethel')
  const caleb = person(C, 'Caleb')

  it('lists the children marked on the day and those marked before, sorted by name', () => {
    const rows = [
      row(caleb, '2026-10-25'),
      row(abel, '2026-11-01', 'absent'),
      row(abel, '2026-10-18'),
      row(abel, '2026-10-25'),
      row(bethel, '2026-11-08'), // first came later: not on this day's list
      row(bethel, '2026-11-01', 'present', OTHER), // another class
    ]
    const register = buildRegister(rows, CLASS, '2026-11-01')
    expect(register.map((e) => e.member.first_name)).toEqual(['Abel', 'Caleb'])
    expect(register[0]).toMatchObject({ record: { status: 'absent' }, lastSeen: '2026-10-25' })
    expect(register[1]).toMatchObject({ record: null, lastSeen: '2026-10-25' })
    expect(registerCounts(register)).toEqual({ present: 0, absent: 1, unmarked: 1 })
  })

  it('treats an unknown status as present and skips rows without a member', () => {
    const rows = [{ ...row(abel, '2026-11-01'), status: null }, { ...row(bethel, '2026-11-01'), member: null }]
    const register = buildRegister(rows, CLASS, '2026-11-01')
    expect(register).toHaveLength(1)
    expect(register[0].record?.status).toBe('present')
    expect(registerCounts(register)).toEqual({ present: 1, absent: 0, unmarked: 0 })
  })

  it('is empty for a class nobody was marked in', () => {
    expect(buildRegister([row(abel, '2026-11-01')], OTHER, '2026-11-01')).toEqual([])
  })
})

describe('children and youth helpers', () => {
  it('formats the local day and labels', () => {
    expect(localToday(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
    expect(teacherRoleLabel('lead')).toBe('Lead teacher')
    expect(teacherRoleLabel('Coordinator')).toBe('Coordinator')
    expect(teacherRoleLabel(null)).toBeNull()
    expect(programTypeLabel('bible_study')).toBe('Bible study')
    expect(programTypeLabel('Camp')).toBe('Camp')
  })
})

describe('children and youth schemas', () => {
  it('accept the form payloads and refuse unknown or server-owned keys', () => {
    expect(childrenTeacherCreate.safeParse({ class_id: CLASS, member_id: A, role: 'lead' }).success).toBe(true)
    expect(childrenTeacherCreate.safeParse({ class_id: CLASS, member_id: A, role: 'boss' }).success).toBe(false)
    expect(childrenTeacherUpdate.safeParse({ member_id: B }).success).toBe(false)
    expect(childrenAttendanceCreate.parse({ class_id: CLASS, member_id: A, attendance_date: '2026-11-01' }).status).toBe('present')
    expect(childrenAttendanceUpdate.safeParse({ status: 'late' }).success).toBe(false)
    expect(childrenAttendanceUpdate.safeParse({ status: 'absent', member_id: A }).success).toBe(false)
    expect(youthProgramCreate.safeParse({ name: 'Retreat', program_date: '2030-05-04', max_participants: 40, program_type: 'retreat' }).success).toBe(true)
    expect(youthProgramCreate.safeParse({ name: 'Retreat', program_date: '2030-05-04', participants_count: 3 }).success).toBe(false)
    expect(youthProgramCreate.safeParse({ name: 'Retreat', program_date: '2030-05-04', max_participants: 0 }).success).toBe(false)
    expect(youthMentorshipUpdate.safeParse({ mentor_id: B }).success).toBe(false)
  })

  it('refuse a mentee as their own mentor', () => {
    expect(youthMentorshipCreate.safeParse({ mentee_id: A, mentor_id: B }).success).toBe(true)
    const same = youthMentorshipCreate.safeParse({ mentee_id: A, mentor_id: A })
    expect(same.success).toBe(false)
    expect(same.error?.issues[0].path).toEqual(['mentor_id'])
  })
})
