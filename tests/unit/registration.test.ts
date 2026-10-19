import { describe, expect, it } from 'vitest'
import {
  FIELDS, MSG, NOT_SERVING, SECTIONS, cleanRegistration, emptyRegistration, isVisible, registrationSchema, type RegistrationValues,
} from '@/lib/members/registration'

const minimal = (over: Partial<RegistrationValues> = {}): RegistrationValues =>
  ({ ...emptyRegistration(), firstNameAm: 'አበበ', fatherNameAm: 'ከበደ', sex: 'male', phone: '0911 234 567', ...over })
const errorsOf = (v: RegistrationValues) => {
  const r = registrationSchema.safeParse(cleanRegistration(v))
  return r.success ? {} : r.error.flatten().fieldErrors
}

describe('registration schema (lebu-form rules)', () => {
  it('accepts the required fields alone', () => {
    expect(errorsOf(minimal())).toEqual({})
  })

  it('reports required fields with the lebu-form message', () => {
    const e = errorsOf({ ...emptyRegistration() })
    for (const k of ['firstNameAm', 'fatherNameAm', 'sex', 'phone']) expect(e).toHaveProperty(k)
    expect(e.firstNameAm).toEqual([MSG.required])
    expect(e.sex).toEqual([MSG.required])
    expect(e.phone).toEqual([MSG.required]) // "required" first, as in lebu-form, not "too short"
  })

  it('checks phone length, email shape and future dates', () => {
    const e = errorsOf(minimal({ phone: '12 34', email: 'not-an-email', dob: '2999-01-01', spousePhone: '1', marital: 'married' }))
    expect(e.phone).toEqual([MSG.phone])
    expect(e.email).toEqual([MSG.email])
    expect(e.dob).toEqual([MSG.future])
    expect(e.spousePhone).toEqual([MSG.phone])
  })

  it('allows a future "member since" date (lebu-form does too)', () => {
    expect(errorsOf(minimal({ memberSince: '2999-01-01' }))).toEqual({})
  })

  it('rejects options the form never offers and unknown keys', () => {
    expect(errorsOf(minimal({ blood: 'type O' as never }))).toHaveProperty('blood')
    expect(registrationSchema.safeParse({ ...minimal(), is_admin: true }).success).toBe(false)
  })

  it('limits rosters (20 children, 10 household members)', () => {
    const kid = { name: 'x', sex: '' as const, edu: '' as const, age: '' }
    expect(errorsOf(minimal({ childrenList: Array(21).fill(kid) }))).toHaveProperty('childrenList')
    expect(errorsOf(minimal({ household: Array(11).fill({ name: 'y', rel: '', age: '' }) }))).toHaveProperty('household')
  })
})

describe('cleanRegistration (lebu-form collect())', () => {
  it('clears fields whose condition is not met', () => {
    const v = cleanRegistration(minimal({ marital: 'single', spouse: 'x', spouseAge: '30', spouseMemberId: '00000000-0000-4000-8000-000000000001', baptized: 'no', baptismDate: '2020-01-01' }))
    expect([v.spouse, v.spouseAge, v.spouseMemberId, v.baptismDate]).toEqual(['', '', '', ''])
  })

  it('keeps conditional fields when the condition holds', () => {
    const v = cleanRegistration(minimal({ marital: 'married', spouse: 'ሰላም', baptized: 'yes', baptismDate: '2020-01-01' }))
    expect(v.spouse).toBe('ሰላም')
    expect(v.baptismDate).toBe('2020-01-01')
  })

  it('makes "not currently serving" exclusive and keeps the wished-for department', () => {
    const v = cleanRegistration(minimal({ depts: ['choir', NOT_SERVING], wantsDept: 'youth' }))
    expect(v.depts).toEqual([NOT_SERVING])
    expect(v.wantsDept).toBe('youth')
    expect(cleanRegistration(minimal({ depts: ['choir'], wantsDept: 'youth' })).wantsDept).toBe('')
  })

  it('drops empty roster rows and defaults status to active', () => {
    const v = cleanRegistration(minimal({
      status: '', childrenList: [{ name: 'ሔዋን', sex: 'female', edu: 'primary', age: '9' }, { name: '', sex: '', edu: '', age: '' }],
    }))
    expect(v.childrenList).toHaveLength(1)
    expect(v.status).toBe('active')
  })
})

describe('field definitions', () => {
  it('every field belongs to a section and every section has fields', () => {
    const ids = SECTIONS.map((s) => s.id)
    for (const f of FIELDS) expect(ids).toContain(f.sec)
    for (const id of ids) expect(FIELDS.some((f) => f.sec === id)).toBe(true)
  })

  it('every field key exists in the schema (keys match lebu-form, so imports map 1:1)', () => {
    const keys = Object.keys(registrationSchema.shape)
    for (const f of FIELDS) expect(keys).toContain(f.k)
  })

  it('isVisible follows showIf for single values and lists', () => {
    const spouse = FIELDS.find((f) => f.k === 'spouse')!
    const wants = FIELDS.find((f) => f.k === 'wantsDept')!
    expect(isVisible(spouse, minimal({ marital: 'married' }))).toBe(true)
    expect(isVisible(spouse, minimal({ marital: 'single' }))).toBe(false)
    expect(isVisible(wants, minimal({ depts: [NOT_SERVING] }))).toBe(true)
  })
})
