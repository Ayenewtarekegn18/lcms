'use client'

import { HandHeart, LifeBuoy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { pastoralOnly } from '@/components/ministry/workspace/pastoral-tab'
import { defineResourceTab } from '@/components/ministry/workspace/types'
import { PASTORAL } from '@/lib/auth/roles'
import type { Tables } from '@/lib/database.types'
import { churchToday } from '@/lib/financial/summary'
import { SUPPORT_CASE_STATUSES, SUPPORT_CASE_TYPES, supportCaseStatusLabel } from '@/lib/ministries/deacons'
import { formatDate, memberName } from '@/lib/members/directory'

// Deacons: care visits and support cases. Both tables are confidential (RLS: admin and elder read and
// write), so the tabs are PASTORAL; other staff see a "confidential" note instead of the lists.

type Person = { id: string; first_name: string; last_name: string } | null
type Visit = Tables<'deacon_care_visits'> & { member: Person; visitor: Person }
type SupportCase = Tables<'deacon_support_cases'> & { member: Person; deacon: Person }

const nameOf = (p: Person, fallback = 'Unknown member') => (p ? memberName(p) : fallback)
const muted = (text: string) => <span className="text-muted-foreground">{text}</span>

const careVisits = defineResourceTab<Visit>({
  key: 'care-visits',
  label: 'Care visits',
  icon: HandHeart,
  api: '/api/deacon-care-visits',
  noun: 'care visit',
  write: PASTORAL,
  searchPlaceholder: 'Search visits by member name',
  describe: (v) => `Visit to ${nameOf(v.member)} on ${formatDate(v.visit_date)}`,
  columns: [
    { key: 'member', header: 'Member', primary: true, cell: (v) => nameOf(v.member) },
    { key: 'visit_date', header: 'Visited', cell: (v) => formatDate(v.visit_date) },
    { key: 'visitor', header: 'Visited by', cell: (v) => nameOf(v.visitor, 'Unknown') },
    { key: 'notes', header: 'Notes', className: 'max-w-xs truncate', cell: (v) => v.notes || muted('—') },
  ],
  fields: [
    { name: 'member_id', label: 'Member visited', type: 'member', required: true, createOnly: true },
    { name: 'visit_date', label: 'Visit date', type: 'date', required: true, width: 'half', defaultValue: churchToday() },
    { name: 'notes', label: 'Notes', type: 'textarea', help: 'Confidential: only administrators and elders can read these.' },
  ],
  empty: { title: 'No care visits recorded yet.', description: 'Record home and hospital visits; you are saved as the visitor.' },
})

const statusBadge = (c: SupportCase) => {
  const status = c.status ?? 'open'
  const variant = status === 'closed' ? 'outline' : status === 'in_progress' ? 'secondary' : 'default'
  return <Badge variant={variant}>{supportCaseStatusLabel(status)}</Badge>
}

const supportCases = defineResourceTab<SupportCase>({
  key: 'support-cases',
  label: 'Support cases',
  icon: LifeBuoy,
  api: '/api/deacon-support-cases',
  noun: 'support case',
  write: PASTORAL,
  searchPlaceholder: 'Search cases by member name',
  describe: (c) => `${c.case_type ? `${c.case_type} case` : 'Case'} for ${nameOf(c.member)}`,
  columns: [
    { key: 'member', header: 'Member', primary: true, cell: (c) => nameOf(c.member) },
    { key: 'case_type', header: 'Type', cell: (c) => c.case_type || muted('—') },
    { key: 'description', header: 'Description', className: 'max-w-[14rem] truncate' },
    { key: 'status', header: 'Status', className: 'whitespace-nowrap', cell: statusBadge },
    { key: 'deacon', header: 'Assigned to', cell: (c) => (c.deacon ? memberName(c.deacon) : muted('Not assigned')) },
    { key: 'created_at', header: 'Opened', hideOnMobile: true, className: 'whitespace-nowrap', cell: (c) => formatDate(c.created_at) ?? muted('—') },
  ],
  fields: [
    { name: 'member_id', label: 'Member', type: 'member', required: true, createOnly: true },
    { name: 'case_type', label: 'Type', type: 'select', options: SUPPORT_CASE_TYPES, width: 'half' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: SUPPORT_CASE_STATUSES.map((s) => ({ value: s, label: supportCaseStatusLabel(s) })),
      defaultValue: 'open',
      width: 'half',
    },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    {
      name: 'assigned_deacon_id',
      label: 'Assigned deacon',
      type: 'member',
      help: 'Optional. When editing, search only to change the deacon; the current one stays otherwise.',
    },
  ],
  empty: { title: 'No support cases yet.', description: 'Open a case when a member needs practical help, and assign a deacon.' },
})

export default function DeaconsPage() {
  return <MinistryWorkspace slug="deacons" tabs={[pastoralOnly(careVisits), pastoralOnly(supportCases)]} />
}
