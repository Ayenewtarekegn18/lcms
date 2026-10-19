import { describe, expect, it } from 'vitest'
import { ethiopianLabel, toEthiopian } from '@/lib/ethiopian-calendar'

describe('toEthiopian', () => {
  it.each([
    ['2026-09-11', { y: 2019, m: 1, d: 1 }], // Enkutatash (New Year)
    ['2027-01-07', { y: 2019, m: 4, d: 29 }], // Genna (Christmas), 29 Tahsas
    ['2026-09-10', { y: 2018, m: 13, d: 5 }], // last day of Pagume
    ['2023-09-12', { y: 2016, m: 1, d: 1 }], // New Year falls on 12 Sep before a Gregorian leap year
    ['2000-01-01', { y: 1992, m: 4, d: 22 }],
  ])('%s', (iso, expected) => {
    expect(toEthiopian(iso)).toEqual(expected)
  })

  it('returns null for anything that is not YYYY-MM-DD', () => {
    for (const bad of ['', null, undefined, '2026-9-11', '11/09/2026', 'tomorrow']) expect(toEthiopian(bad)).toBeNull()
  })
})

describe('ethiopianLabel', () => {
  it('formats with the Amharic month name and ዓ.ም.', () => {
    expect(ethiopianLabel('2026-09-11')).toBe('መስከረም 1, 2019 ዓ.ም.')
  })
  it('is empty for no date', () => {
    expect(ethiopianLabel('')).toBe('')
  })
})
