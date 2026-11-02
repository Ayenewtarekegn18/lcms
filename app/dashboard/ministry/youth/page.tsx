'use client'

import { HeartHandshake, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { defineResourceTab } from '@/components/ministry/workspace/types'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'
import { YOUTH_PROGRAM_TYPE_OPTIONS, programTypeLabel } from '@/lib/ministries/youth'

// Youth Ministry: programs (youth_programs) and mentoring pairs (youth_mentorship). Config only.

type Person = { id: string; first_name: string; last_name: string }
type Program = Tables<'youth_programs'> & { leader: Person | null }
type Mentorship = Tables<'youth_mentorship'> & { mentee: Person | null; mentor: Person | null }

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const personName = (p: Person | null) => (p ? memberName(p) : 'Unknown member')

const programs = defineResourceTab<Program>({
  key: 'programs',
  label: 'Programs',
  icon: Sparkles,
  api: '/api/youth-programs',
  noun: 'program',
  searchPlaceholder: 'Search programs',
  describe: (p) => p.name,
  columns: [
    {
      key: 'name',
      header: 'Program',
      primary: true,
      cell: (p) => (
        <div className="min-w-0">
          <p className="break-words font-medium">{p.name}</p>
          {p.age_range && <p className="text-xs font-normal text-muted-foreground">Ages {p.age_range}</p>}
        </div>
      ),
    },
    { key: 'program_date', header: 'Date', cell: (p) => formatDate(p.program_date) ?? muted('—') },
    { key: 'program_type', header: 'Type', cell: (p) => (p.program_type ? <Badge variant="secondary">{programTypeLabel(p.program_type)}</Badge> : muted('—')) },
    { key: 'leader', header: 'Leader', cell: (p) => (p.leader ? memberName(p.leader) : muted('—')) },
    { key: 'location', header: 'Where' },
    { key: 'max_participants', header: 'Places', cell: (p) => (p.max_participants ? `Up to ${p.max_participants}` : muted('—')) },
    { key: 'is_active', header: 'Status', cell: (p) => (p.is_active === false ? <Badge variant="outline">Inactive</Badge> : <Badge>Active</Badge>) },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'program_date', label: 'Date', type: 'date', required: true, width: 'half' },
    { name: 'program_type', label: 'Type', type: 'select', options: YOUTH_PROGRAM_TYPE_OPTIONS, width: 'half' },
    { name: 'age_range', label: 'Ages', type: 'text', maxLength: 50, placeholder: 'e.g. 13–18', width: 'half' },
    { name: 'max_participants', label: 'Places', type: 'number', min: 1, max: 100000, width: 'half', help: 'Leave empty for no limit.' },
    { name: 'location', label: 'Where', type: 'text' },
    { name: 'leader_id', label: 'Leader', type: 'member', help: 'Search the member register to choose or change the leader.' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'is_active', label: 'Active (shown to members)', type: 'checkbox', defaultValue: true },
  ],
  empty: { title: 'No programs yet.', description: 'Plan Bible studies, worship nights, retreats and more.' },
})

const mentorship = defineResourceTab<Mentorship>({
  key: 'mentorship',
  label: 'Mentorship',
  icon: HeartHandshake,
  api: '/api/youth-mentorship',
  noun: 'mentoring pair',
  searchPlaceholder: 'Search by mentee name',
  describe: (m) => `${personName(m.mentee)} with ${personName(m.mentor)}`,
  columns: [
    { key: 'mentee', header: 'Mentee', primary: true, cell: (m) => personName(m.mentee) },
    { key: 'mentor', header: 'Mentor', cell: (m) => personName(m.mentor) },
    { key: 'start_date', header: 'Since', cell: (m) => formatDate(m.start_date) ?? muted('—') },
    { key: 'notes', header: 'Notes', className: 'max-w-xs truncate', hideOnMobile: true, cell: (m) => m.notes || muted('—') },
    { key: 'is_active', header: 'Status', cell: (m) => (m.is_active === false ? <Badge variant="outline">Ended</Badge> : <Badge>Active</Badge>) },
  ],
  fields: [
    { name: 'mentee_id', label: 'Mentee', type: 'member', required: true, createOnly: true, help: 'Each young person has one mentor.' },
    { name: 'mentor_id', label: 'Mentor', type: 'member', required: true, createOnly: true },
    { name: 'start_date', label: 'Since', type: 'date', width: 'half', help: 'Leave empty for today.' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
    { name: 'is_active', label: 'Active (still meeting)', type: 'checkbox', defaultValue: true },
  ],
  empty: { title: 'No mentoring pairs yet.', description: 'Pair young people with a mentor.' },
})

export default function YouthPage() {
  return <MinistryWorkspace slug="youth" tabs={[programs, mentorship]} />
}
