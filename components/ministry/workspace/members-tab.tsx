import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate, memberName } from '@/lib/members/directory'
import { MINISTRY_ROLE_OPTIONS, ministryRoleLabel, normalizeMinistryRole, type MinistryMembership } from '@/lib/ministries/workspace'
import { defineResourceTab } from './types'

const roleVariant = { leader: 'default', co_leader: 'secondary', member: 'outline' } as const

/** A person's role in the ministry as a badge (leader, co-leader, member). */
export function MinistryRoleBadge({ role }: { role: string | null }) {
  return <Badge variant={roleVariant[normalizeMinistryRole(role)]} className="font-medium">{ministryRoleLabel(role)}</Badge>
}

const name = (m: MinistryMembership) => (m.member ? memberName(m.member) : 'Unknown member')

/**
 * Every workspace's Members tab: ministry_members of this ministry with names and roles. Add someone
 * from the member register, change their role, remove them (the membership is deactivated).
 * A ResourceTab config like any other, so it doubles as the reference example.
 */
export const membersTab = defineResourceTab<MinistryMembership>({
  key: 'members',
  label: 'Members',
  icon: Users,
  api: '/api/ministry-members',
  scope: 'ministry',
  noun: 'member',
  searchPlaceholder: 'Search members by name',
  refreshesHeader: true,
  deleteVerb: 'Remove',
  deleteNote: 'They stay in the member register and can be added again.',
  describe: name,
  columns: [
    {
      key: 'name',
      header: 'Name',
      primary: true,
      cell: (m) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{name(m)}</p>
          {m.member?.email && <p className="truncate text-xs font-normal text-muted-foreground">{m.member.email}</p>}
        </div>
      ),
    },
    { key: 'role', header: 'Role', cell: (m) => <MinistryRoleBadge role={m.role} /> },
    { key: 'phone', header: 'Phone', cell: (m) => m.member?.phone || <span className="text-muted-foreground">—</span> },
    { key: 'joined_date', header: 'Joined', cell: (m) => formatDate(m.joined_date) ?? <span className="text-muted-foreground">—</span> },
  ],
  fields: [
    { name: 'member_id', label: 'Member', type: 'member', required: true, createOnly: true, help: 'Anyone in the member register.' },
    { name: 'role', label: 'Role', type: 'select', required: true, options: MINISTRY_ROLE_OPTIONS, defaultValue: 'member', width: 'half' },
    { name: 'joined_date', label: 'Joined', type: 'date', width: 'half' },
  ],
  empty: { title: 'No members yet.', description: 'Add people from the member register and give them a role.' },
})
