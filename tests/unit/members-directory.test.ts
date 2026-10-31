import { describe, expect, it } from 'vitest'
import {
  activeMinistries, changedFields, directoryFilters, formatDate, memberName, rangeLabel, toEditValues, type DirectoryMember,
} from '@/lib/members/directory'
import { readApiError } from '@/lib/api/client-errors'

describe('directoryFilters', () => {
  it('returns nothing for an empty search', () => {
    expect(directoryFilters('')).toEqual([])
    expect(directoryFilters(null)).toEqual([])
    expect(directoryFilters('   ')).toEqual([])
  })

  it('makes one or-filter per word over names, email and phone', () => {
    expect(directoryFilters('abeba 0911')).toEqual([
      'first_name.ilike.%abeba%,last_name.ilike.%abeba%,email.ilike.%abeba%,phone.ilike.%abeba%',
      'first_name.ilike.%0911%,last_name.ilike.%0911%,email.ilike.%0911%,phone.ilike.%0911%',
    ])
  })

  it('uses at most five words', () => {
    expect(directoryFilters('a b c d e f g')).toHaveLength(5)
  })
})

describe('member display helpers', () => {
  it('memberName joins and trims the names, with a fallback', () => {
    expect(memberName({ first_name: ' Abeba ', last_name: 'Kebede' })).toBe('Abeba Kebede')
    expect(memberName({ first_name: 'Abeba', last_name: '' })).toBe('Abeba')
    expect(memberName({ first_name: '', last_name: ' ' })).toBe('Unnamed member')
  })

  it('activeMinistries lists only current memberships', () => {
    const m = {
      ministry_members: [
        { is_active: true, ministry: { name: 'Choir' } },
        { is_active: false, ministry: { name: 'Youth' } },
        { is_active: null, ministry: { name: 'Prayer' } },
        { is_active: true, ministry: null },
      ],
    } as Pick<DirectoryMember, 'ministry_members'>
    expect(activeMinistries(m)).toEqual(['Choir', 'Prayer'])
  })

  it('rangeLabel describes the page', () => {
    expect(rangeLabel(0, 0, 0)).toBe('0 of 0')
    expect(rangeLabel(0, 50, 123)).toBe('1–50 of 123')
    expect(rangeLabel(100, 23, 123)).toBe('101–123 of 123')
    expect(rangeLabel(50, 10, 40)).toBe('51–60 of 60') // total never below what is shown
  })

  it('formatDate shows the same calendar day in any time zone', () => {
    expect(formatDate('1990-03-12')).toBe('12 Mar 1990')
    expect(formatDate('1990-03-12T23:30:00+03:00')).toBe('12 Mar 1990')
    expect(formatDate(null)).toBeNull()
    expect(formatDate('not a date')).toBe('not a date')
  })
})

describe('edit form values', () => {
  const profile = { first_name: 'Abeba', last_name: '', email: 'a@b.et', phone: '0911', date_of_birth: null, address: null }

  it('toEditValues turns nulls into empty strings', () => {
    expect(toEditValues(profile)).toEqual({
      first_name: 'Abeba', last_name: '', email: 'a@b.et', phone: '0911', date_of_birth: '', address: '',
    })
  })

  it('changedFields sends only the trimmed fields that changed', () => {
    const before = toEditValues(profile)
    expect(changedFields(before, { ...before })).toEqual({})
    expect(changedFields(before, { ...before, first_name: ' Abeba  ' })).toEqual({})
    expect(changedFields(before, { ...before, phone: ' 0922 ', email: '' })).toEqual({ phone: '0922', email: '' })
  })
})

describe('readApiError', () => {
  const res = (status: number, body?: unknown) =>
    new Response(body === undefined ? 'not json' : JSON.stringify(body), { status })

  it('explains auth failures', async () => {
    expect((await readApiError(res(401, { error: 'Unauthorized' }), 'x')).message).toMatch(/sign in again/)
    expect((await readApiError(res(403, { error: 'Forbidden' }), 'x')).message).toBe('You are not allowed to do that.')
  })

  it('uses a specific server message but not a generic one', async () => {
    expect((await readApiError(res(400, { error: 'You cannot deactivate your own account.' }), 'Fallback')).message)
      .toBe('You cannot deactivate your own account.')
    expect((await readApiError(res(400, { error: 'Invalid request' }), 'Fallback')).message).toBe('Fallback')
    expect((await readApiError(res(500), 'Fallback')).message).toBe('Fallback')
  })

  it('returns the first message per field', async () => {
    const r = await readApiError(res(400, { error: 'Invalid request', issues: { fieldErrors: { email: ['Invalid email', 'x'], phone: [] } } }), 'F')
    expect(r.fieldErrors).toEqual({ email: 'Invalid email' })
  })

  it('mentions duplicates on 409', async () => {
    expect((await readApiError(res(409, { error: 'Conflict' }), 'Could not add.')).message).toBe('Could not add. It already exists.')
  })
})
