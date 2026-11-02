import type { Tables } from '@/lib/database.types'
import type { Role } from '@/lib/auth/roles'
import { memberName } from '@/lib/members/directory'

// Ministry workspaces (docs/MINISTRY_WORKSPACES.md): what the ministry APIs return and the small rules
// the pages share. No server code here, so client components can import it.

/** A person's role inside one ministry (ministry_members.role). */
export const MINISTRY_ROLES = ['leader', 'co_leader', 'member'] as const
export type MinistryRole = (typeof MINISTRY_ROLES)[number]
export const LEADER_ROLES: readonly MinistryRole[] = ['leader', 'co_leader']

const ROLE_LABELS: Record<MinistryRole, string> = { leader: 'Leader', co_leader: 'Co-leader', member: 'Member' }
export const MINISTRY_ROLE_OPTIONS = MINISTRY_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }))

/** Older rows hold free text such as 'Member' or 'Co-Leader'; map them onto the three roles. */
export function normalizeMinistryRole(role: string | null | undefined): MinistryRole {
  const key = (role ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  return (MINISTRY_ROLES as readonly string[]).includes(key) ? (key as MinistryRole) : 'member'
}
export const ministryRoleLabel = (role: string | null | undefined) => ROLE_LABELS[normalizeMinistryRole(role)]

type Person = Pick<Tables<'profiles'>, 'first_name' | 'last_name'>
export type MinistryPerson = Person & { id: string }

/** A ministry_members row with the member's name, as GET /api/ministry-members returns it. */
export type MinistryMembership = Tables<'ministry_members'> & {
  member: (MinistryPerson & { email: string | null; phone: string | null }) | null
}

export type Ministry = Tables<'ministries'>

/** GET /api/ministries/by-slug/[slug] */
export type MinistryWorkspaceData = {
  ministry: Ministry
  member_count: number
  leaders: { member_id: string; name: string; role: MinistryRole }[]
  upcoming_events: number
  /** The signed-in user's app role, so the page offers only the actions the API will allow. */
  viewer: { role: Role }
}

/** GET /api/ministries/workspaces: one card on the ministries hub. */
export type MinistryCard = Pick<Ministry, 'id' | 'slug' | 'name' | 'name_am' | 'description' | 'meeting_day' | 'meeting_time' | 'location'> & {
  member_count: number
  leaders: string[]
}

/** Leader names: the ministry's own leader_id first, then members with a leader role, no duplicates. */
export function leaderList(
  leader: MinistryPerson | null,
  memberships: { role: string | null; member: MinistryPerson | null }[],
): { member_id: string; name: string; role: MinistryRole }[] {
  const list: { member_id: string; name: string; role: MinistryRole }[] = []
  if (leader) list.push({ member_id: leader.id, name: memberName(leader), role: 'leader' })
  const rank = (role: string | null) => MINISTRY_ROLES.indexOf(normalizeMinistryRole(role))
  const ranked = [...memberships].sort((a, b) => rank(a.role) - rank(b.role))
  for (const m of ranked) {
    const role = normalizeMinistryRole(m.role)
    if (!m.member || !LEADER_ROLES.includes(role) || list.some((l) => l.member_id === m.member!.id)) continue
    list.push({ member_id: m.member.id, name: memberName(m.member), role })
  }
  return list
}

/** 'Saturday · 15:00' from meeting_day and meeting_time, or null when neither is set. */
export function meetingLabel(m: Pick<Ministry, 'meeting_day' | 'meeting_time'>) {
  const parts = [m.meeting_day, m.meeting_time].map((s) => s?.trim()).filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}
