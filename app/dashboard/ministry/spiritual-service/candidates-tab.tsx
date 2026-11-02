'use client'

import { useId, useMemo, useState } from 'react'
import { Sprout } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { selectClass } from '@/components/app/entity-form-dialog'
import { ResourceTab } from '@/components/ministry/workspace/resource-tab'
import { defineResourceTab, type WorkspaceContext } from '@/components/ministry/workspace/types'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'
import { CANDIDATE_STATUS_OPTIONS, candidateStatusLabel } from '@/lib/ministries/spiritual-service'

type Person = { id: string; first_name: string; last_name: string }
type Candidate = Tables<'spiritual_candidates'> & {
  member: (Person & { email: string | null; phone: string | null }) | null
  mentor: Person | null
}

const name = (c: Candidate) => (c.member ? memberName(c.member) : 'Unknown member')
const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const statusVariant = { salvation_candidate: 'outline', baptism_ready: 'secondary', baptized: 'default' } as const

export const candidatesConfig = defineResourceTab<Candidate>({
  key: 'candidates',
  label: 'Candidates',
  icon: Sprout,
  api: '/api/spiritual-candidates',
  noun: 'candidate',
  searchPlaceholder: 'Search candidates by name',
  describe: name,
  columns: [
    {
      key: 'name',
      header: 'Candidate',
      primary: true,
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{name(c)}</p>
          {(c.member?.phone || c.member?.email) && <p className="truncate text-xs font-normal text-muted-foreground">{c.member.phone || c.member.email}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => <Badge variant={statusVariant[c.status as keyof typeof statusVariant] ?? 'outline'}>{candidateStatusLabel(c.status) ?? c.status}</Badge>,
    },
    { key: 'mentor', header: 'Mentor', cell: (c) => (c.mentor ? memberName(c.mentor) : muted('None')) },
    { key: 'joined_date', header: 'Joined', cell: (c) => formatDate(c.joined_date) ?? muted('—') },
    { key: 'baptism_date', header: 'Baptism', cell: (c) => formatDate(c.baptism_date) ?? muted('—') },
    { key: 'progress_notes', header: 'Progress', hideOnMobile: true, className: 'max-w-xs truncate', cell: (c) => c.progress_notes ?? muted('—') },
  ],
  fields: [
    { name: 'member_id', label: 'Candidate', type: 'member', required: true, createOnly: true, help: 'Anyone in the member register.' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: CANDIDATE_STATUS_OPTIONS, defaultValue: 'salvation_candidate' },
    { name: 'mentor_id', label: 'Mentor', type: 'member', help: 'Anyone in the member register. To change it later, search for someone else.' },
    { name: 'joined_date', label: 'Joined', type: 'date', width: 'half', help: 'Leave empty for today.' },
    { name: 'baptism_date', label: 'Baptism date', type: 'date', width: 'half' },
    { name: 'progress_notes', label: 'Progress notes', type: 'textarea' },
  ],
  empty: { title: 'No candidates yet.', description: 'Add members who are preparing for salvation and baptism.' },
})

/** Candidates with a status filter above the list (the rest is the ResourceTab config above). */
export function CandidatesTab({ ctx }: { ctx: WorkspaceContext }) {
  const id = useId()
  const [status, setStatus] = useState('')
  const config = useMemo(() => ({ ...candidatesConfig, params: status ? { status } : undefined }), [status])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label htmlFor={id} className="shrink-0 text-muted-foreground">Status</Label>
        <select id={id} className={`${selectClass} bg-card sm:w-56`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {CANDIDATE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <ResourceTab config={config} ctx={ctx} />
    </div>
  )
}
