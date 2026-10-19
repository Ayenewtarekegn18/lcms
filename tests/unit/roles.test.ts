import { describe, expect, it } from 'vitest'
import { PAGE_ACCESS, REGISTRARS, ROLES, toRole } from '@/lib/auth/roles'

describe('toRole', () => {
  it('uses profiles.role when it is a known role', () => {
    for (const r of ROLES) expect(toRole(r)).toBe(r)
  })
  it('falls back to member for missing or unknown roles', () => {
    expect(toRole(undefined)).toBe('member')
    expect(toRole('superuser')).toBe('member')
  })
  it('treats the legacy is_admin flag as admin (databases before the role column)', () => {
    expect(toRole(undefined, true)).toBe('admin')
    expect(toRole('member', true)).toBe('admin')
  })
})

describe('PAGE_ACCESS (mirrors docs/ROLES_AND_ACCESS.md)', () => {
  it('admin and elder can open every section', () => {
    for (const roles of Object.values(PAGE_ACCESS)) {
      expect(roles).toContain('admin')
      if (roles !== REGISTRARS) expect(roles).toContain('elder')
    }
  })
  it('plain members can open none of the restricted sections', () => {
    for (const roles of Object.values(PAGE_ACCESS)) expect(roles).not.toContain('member')
  })
  it('finance sees the ledger and reports but not pastoral or member data', () => {
    expect(PAGE_ACCESS.financial).toContain('finance')
    expect(PAGE_ACCESS.reports).toContain('finance')
    expect(PAGE_ACCESS.members).not.toContain('finance')
    expect(PAGE_ACCESS.auditLog).not.toContain('finance')
  })
  it('registrars are a subset of the roles that can open the members section', () => {
    for (const r of REGISTRARS) expect(PAGE_ACCESS.members).toContain(r)
  })
})
