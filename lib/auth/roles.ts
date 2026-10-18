// Role model shared by server guards and client components (no server-only imports here).
// Mirrors docs/ROLES_AND_ACCESS.md; RLS in the database is the authoritative copy.

export const ROLES = ['admin', 'elder', 'ministry_leader', 'finance', 'member'] as const
export type Role = (typeof ROLES)[number]

const STAFF: readonly Role[] = ['admin', 'elder', 'ministry_leader']

/** Roles allowed to open each restricted dashboard section. Unlisted sections are open to every signed-in user. */
export const PAGE_ACCESS = {
  members: STAFF,
  financial: ['admin', 'elder', 'finance'],
  communications: STAFF,
  documents: STAFF,
  reports: [...STAFF, 'finance'],
  auditLog: ['admin', 'elder'],
  ministry: STAFF,
  events: STAFF,
  attendance: STAFF,
} satisfies Record<string, readonly Role[]>

/**
 * Normalise a profile row to a Role. Falls back to the legacy is_admin flag so the app
 * keeps working on databases where docs/remediation/sql/01 has not added profiles.role yet.
 */
export function toRole(role: unknown, isAdmin?: unknown): Role {
  if (isAdmin === true) return 'admin'
  return typeof role === 'string' && (ROLES as readonly string[]).includes(role) ? (role as Role) : 'member'
}
