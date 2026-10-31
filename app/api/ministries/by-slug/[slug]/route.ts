import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { notFound } from '@/lib/api/validation'
import { LEADER_ROLES, leaderList, type MinistryWorkspaceData } from '@/lib/ministries/workspace'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

// One ministry workspace's header: the ministry, how many active members it has, its leaders and how
// many of its events are still to come. Staff only, like the workspace pages and the ministry_members
// policy (RLS); members could read the ministry itself, but not who serves in it.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const { slug } = await params
  if (!SLUG.test(slug) || slug.length > 64) return notFound()
  const db = auth.supabase

  const { data: ministry, error } = await db
    .from('ministries')
    .select('*, leader:profiles!leader_id(id, first_name, last_name)')
    .eq('slug', slug)
    .maybeSingle()
  if (error) return dbError(error)
  if (!ministry) return notFound()

  const today = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`
  const [members, leaders, events] = await Promise.all([
    db.from('ministry_members').select('id', { count: 'exact', head: true }).eq('ministry_id', ministry.id).eq('is_active', true),
    db
      .from('ministry_members')
      .select('role, member:profiles!member_id(id, first_name, last_name)')
      .eq('ministry_id', ministry.id)
      .eq('is_active', true)
      .in('role', [...LEADER_ROLES])
      .limit(20),
    db
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('ministry_id', ministry.id)
      .not('is_active', 'is', false)
      .or(`end_date.gte.${today},start_date.gte.${today}`),
  ])
  const failed = members.error ?? leaders.error ?? events.error
  if (failed) return dbError(failed)

  const { leader, ...row } = ministry
  const body: MinistryWorkspaceData = {
    ministry: row,
    member_count: members.count ?? 0,
    leaders: leaderList(leader, leaders.data ?? []),
    upcoming_events: events.count ?? 0,
    viewer: { role: auth.role },
  }
  return NextResponse.json(body)
}
