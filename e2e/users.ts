// Test accounts created on the e2e stack by e2e/stack/seed.mjs (test-only credentials).
export const E2E_PASSWORD = 'E2e-Test-Password-1'

export const E2E_USERS = {
  admin: 'admin@e2e.test',
  elder: 'elder@e2e.test',
  ministry_leader: 'leader@e2e.test',
  finance: 'finance@e2e.test',
  member: 'member@e2e.test',
} as const

export type E2ERole = keyof typeof E2E_USERS
