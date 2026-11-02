'use client'

import { HandHeart, Lock, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LookupResourceTab, type Lookup } from '@/components/ministry/workspace/lookup-resource-tab'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { defineResourceTab, type CustomTab } from '@/components/ministry/workspace/types'
import { PASTORAL } from '@/lib/auth/roles'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'
import { normalizePrayerStatus, PRAYER_REQUEST_STATUS_OPTIONS, prayerStatusLabel } from '@/lib/ministries/prayer'

// Prayer Groups: the groups and when they meet (config only), and the prayer requests, which are
// confidential (RLS: admin and elder see and manage them all; anyone else only the ones they submitted).

type Group = Tables<'prayer_groups'>
type Request = Tables<'prayer_requests'> & {
  group: Pick<Group, 'id' | 'name'> | null
  requested_by: { id: string; first_name: string; last_name: string } | null
}

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>

const groups = defineResourceTab<Group>({
  key: 'groups',
  label: 'Groups',
  icon: UsersRound,
  api: '/api/prayer-groups',
  noun: 'prayer group',
  searchPlaceholder: 'Search groups',
  describe: (g) => g.name,
  columns: [
    { key: 'name', header: 'Group', primary: true },
    { key: 'meeting_schedule', header: 'Meets', cell: (g) => g.meeting_schedule ?? muted('Not set') },
    { key: 'description', header: 'Description', className: 'max-w-md truncate' },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'meeting_schedule', label: 'Meets', type: 'text', placeholder: 'Wednesdays 6:00 PM, church hall' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  deleteNote: 'Its prayer requests are kept, without a group. This cannot be undone.',
  empty: { title: 'No prayer groups yet.', description: 'Add the groups that meet to pray and when they meet.' },
})

const STATUS_BADGE = { open: 'default', answered: 'secondary', closed: 'outline' } as const

const firstLine = (text: string, max = 60) => {
  const line = text.split('\n')[0].trim()
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

const requestsConfig = defineResourceTab<Request>({
  key: 'requests',
  label: 'Prayer requests',
  icon: HandHeart,
  api: '/api/prayer-requests',
  noun: 'prayer request',
  write: PASTORAL,
  searchPlaceholder: 'Search requests',
  describe: (r) => firstLine(r.request_text),
  columns: [
    { key: 'request_text', header: 'Request', primary: true, className: 'max-w-md', cell: (r) => <span className="line-clamp-3 whitespace-pre-line">{r.request_text}</span> },
    { key: 'group', header: 'Group', cell: (r) => r.group?.name ?? muted('No group') },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => <Badge variant={STATUS_BADGE[normalizePrayerStatus(r.status)]}>{prayerStatusLabel(r.status)}</Badge>,
    },
    { key: 'requested_by', header: 'Requested by', cell: (r) => (r.requested_by ? memberName(r.requested_by) : muted('—')), hideOnMobile: true },
    { key: 'created_at', header: 'Received', cell: (r) => formatDate(r.created_at) ?? muted('—'), hideOnMobile: true },
  ],
  fields: [
    { name: 'request_text', label: 'Request', type: 'textarea', required: true },
    { name: 'group_id', label: 'Prayer group', type: 'select', help: 'The group that will pray for it (optional).' },
    { name: 'status', label: 'Status', type: 'select', options: PRAYER_REQUEST_STATUS_OPTIONS, required: true, defaultValue: 'open' },
  ],
  empty: { title: 'No prayer requests.', description: 'Requests the church receives are listed here.' },
})

const groupLookup: Lookup<Group> = {
  api: '/api/prayer-groups',
  field: 'group_id',
  option: (g) => ({ value: g.id, label: g.name }),
  filter: { label: 'Group', all: 'All groups' },
}

const requests: CustomTab = {
  key: requestsConfig.key,
  label: requestsConfig.label,
  icon: requestsConfig.icon,
  render: (ctx) => (
    <LookupResourceTab
      ctx={ctx}
      config={requestsConfig}
      lookup={groupLookup}
      notice={
        <span className="inline-flex items-start gap-1.5">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {PASTORAL.includes(ctx.role)
            ? 'Confidential: only admins and elders see these requests.'
            : 'Prayer requests are confidential: admins and elders see and manage them. You only see requests you submitted.'}
        </span>
      }
    />
  ),
}

export default function PrayerGroupsPage() {
  return <MinistryWorkspace slug="prayer-groups" tabs={[groups, requests]} />
}
