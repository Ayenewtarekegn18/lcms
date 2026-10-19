// Gregorian → Ethiopian calendar (same algorithm as the lebu-form register), for showing
// "መስከረም 1, 2019 ዓ.ም." next to dates staff enter.

export const EC_MONTHS = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'] as const

function gregorianToJDN(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12)
  const y2 = y + 4800 - a
  const m2 = m + 12 * a - 3
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045
}

/** '2026-09-11' → { y: 2019, m: 1, d: 1 } (Ethiopian New Year). null for anything that isn't YYYY-MM-DD. */
export function toEthiopian(iso: string | null | undefined): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''))
  if (!match) return null
  const e = gregorianToJDN(+match[1], +match[2], +match[3]) - 1723856
  const r = ((e % 1461) + 1461) % 1461
  const n = (r % 365) + 365 * Math.floor(r / 1460)
  return {
    y: 4 * Math.floor(e / 1461) + Math.floor(r / 365) - Math.floor(r / 1460),
    m: Math.floor(n / 30) + 1,
    d: (n % 30) + 1,
  }
}

/** '2026-09-11' → 'መስከረም 1, 2019 ዓ.ም.' ('' when not a date) */
export function ethiopianLabel(iso: string | null | undefined): string {
  const e = toEthiopian(iso)
  return e ? `${EC_MONTHS[e.m - 1]} ${e.d}, ${e.y} ዓ.ም.` : ''
}
