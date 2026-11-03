import { describe, expect, it } from 'vitest'
import { membersFromJson, prepareImport } from '@/lib/members/registration'

const record = {
  memberId: 'lkhc-0019', firstNameAm: 'ሳሙኤል', fatherNameAm: 'ታደሰ', gfNameAm: 'ገብሬ', sex: 'male', dob: '1999-04-09',
  phone: '0911000019', email: 'samuel@example.com', subcity: 'nifas-silk', memberSince: '2007-05-12',
  baptized: 'yes', depts: ['choir', 'worship'], status: 'active', education: 'degree',
  emgName: 'Martha', emgPhone: '0911000020', emgRel: 'Mother', photoDrive: 'drive-file-id', createdAt: '2026-10-04',
}

describe('membersFromJson', () => {
  it('reads a lebu-form backup, a plain array and a single member', () => {
    expect(membersFromJson({ church: {}, count: 1, members: [record] })).toHaveLength(1)
    expect(membersFromJson([record, record])).toHaveLength(2)
    expect(membersFromJson(record)).toEqual([record])
  })
  it('ignores values that are not records', () => {
    expect(membersFromJson([record, null, 'x', [1]])).toEqual([record])
  })
})

describe('prepareImport', () => {
  it('keeps the member number (upper case) and maps the form fields', () => {
    const p = prepareImport(record)
    expect(p.ok).toBe(true)
    if (!p.ok) return
    expect(p.number).toBe('LKHC-0019')
    expect(p.data).toMatchObject({ firstNameAm: 'ሳሙኤል', fatherNameAm: 'ታደሰ', sex: 'male', phone: '0911000019', depts: ['choir', 'worship'] })
    expect(p.data).not.toHaveProperty('photoDrive') // lebu-form bookkeeping is not part of the register
  })
  it('accepts departments as the sheet\'s "a;b" text', () => {
    const p = prepareImport({ ...record, depts: 'choir;worship' })
    expect(p.ok && p.data.depts).toEqual(['choir', 'worship'])
  })
  it('refuses a record without a usable number or a required field', () => {
    expect(prepareImport({ ...record, memberId: '' })).toMatchObject({ ok: false, error: expect.stringContaining('no member number') })
    expect(prepareImport({ ...record, memberId: 'LKHC 19' })).toMatchObject({ ok: false, error: expect.stringContaining('not like') })
    expect(prepareImport({ ...record, phone: '' })).toMatchObject({ ok: false, error: expect.stringContaining('Mobile phone') })
  })
  it('drops an invalid optional answer instead of losing the member', () => {
    const p = prepareImport({ ...record, blood: 'type O' })
    expect(p).toMatchObject({ ok: true, dropped: ['blood'] })
  })
})
