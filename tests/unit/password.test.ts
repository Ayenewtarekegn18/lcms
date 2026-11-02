import { describe, expect, it } from 'vitest'
import { passwordProblem } from '@/lib/auth/password'

describe('passwordProblem', () => {
  it('accepts 12+ characters with upper, lower case and a digit', () => {
    expect(passwordProblem('Kale-Hiwot-2026')).toBeNull()
  })
  it('refuses short passwords', () => {
    expect(passwordProblem('Short1a')).toMatch(/12 characters/)
  })
  it('refuses a missing upper case letter, lower case letter or digit', () => {
    for (const pw of ['lowercase-only-123', 'UPPERCASE-ONLY-123', 'No-Digits-Here-At-All']) {
      expect(passwordProblem(pw)).toMatch(/upper and lower case/)
    }
  })
})
