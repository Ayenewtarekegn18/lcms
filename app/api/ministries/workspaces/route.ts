import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { LEADER_ROLES, leaderList, type MinistryCard } from '@/lib/ministries/workspace'

// The ministries hub (/dashboard/ministry): every active ministry that has a workspace (a slug), with
// its leaders and active member count, in one query (embedded count and filtered embeds).
// Staff only, like the hub page and the ministry_members policy (RLS).
export async function GET() {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from('ministries')
    .select(
      'id, slug, name, name_am, description, meeting_day, meeting_time, location, ' +
        'leader:profiles!leader_id(id, first_name, last_name), ' +
        'members:ministry_members(count), ' +
        'leaders:ministry_members(role, member:profiles!member_id(id, first_name, last_name))',
    )
    .not('slug', 'is', null)
    .not('is_active', 'is', false)
    .eq('members.is_active', true)
    .eq('leaders.is_active', true)
    .in('leaders.role', [...LEADER_ROLES])
    .order('name')
  if (error) return dbError(error)

  type Row = MinistryCard & {
    leader: { id: string; first_name: string; last_name: string } | null
    members: { count: number }[]
    leaders: { role: string | null; member: { id: string; first_name: string; last_name: string } | null }[]
  }
  const cards: MinistryCard[] = ((data ?? []) as unknown as Row[]).map(({ leader, members, leaders, ...m }) => ({
    ...m,
    member_count: members[0]?.count ?? 0,
    leaders: leaderList(leader, leaders).map((l) => l.name),
  }))
  return NextResponse.json(cards)
}
