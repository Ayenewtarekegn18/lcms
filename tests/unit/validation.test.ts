import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { cleanSearch, opt, pageRange, parseId } from '@/lib/api/validation'

describe('cleanSearch', () => {
  it('drops PostgREST filter syntax and LIKE wildcards', () => {
    expect(cleanSearch("a'),or(id.neq.0")).toBe("a'orid.neq.0")
    expect(cleanSearch('100%_off')).toBe('100off')
  })
  it('keeps Amharic, digits, spaces and @ . - \'', () => {
    expect(cleanSearch('  አበበ ከበደ 0911 ab@c.d-e  ')).toBe('አበበ ከበደ 0911 ab@c.d-e')
  })
  it('is null when nothing is left, and caps the length', () => {
    expect(cleanSearch('(),%')).toBeNull()
    expect(cleanSearch(null)).toBeNull()
    expect(cleanSearch('x'.repeat(500))).toHaveLength(100)
  })
})

describe('pageRange', () => {
  const p = (q: string, d?: number) => pageRange(new URLSearchParams(q), d)
  it('defaults to the first 200 rows', () => expect(p('')).toEqual([0, 199]))
  it('honours limit and offset', () => expect(p('limit=10&offset=20')).toEqual([20, 29]))
  it('keeps the limit between 1 and 500 and ignores nonsense', () => {
    expect(p('limit=100000')).toEqual([0, 499])
    expect(p('limit=-5&offset=-3')).toEqual([0, 0])
    expect(p('limit=abc&offset=xyz')).toEqual([0, 199])
  })
})

describe('parseId', () => {
  it('accepts uuids only', () => {
    expect(parseId('00000000-0000-4000-8000-000000000001')).toBe('00000000-0000-4000-8000-000000000001')
    expect(parseId('1 or 1=1')).toBeNull()
  })
})

describe('opt()', () => {
  const s = z.object({ note: opt(z.string().max(3)) }).strict()
  it('turns "" into null and allows a missing key', () => {
    expect(s.parse({ note: '' })).toEqual({ note: null })
    expect(s.parse({})).toEqual({})
  })
  it('still validates real values', () => {
    expect(s.safeParse({ note: 'toolong' }).success).toBe(false)
  })
})
