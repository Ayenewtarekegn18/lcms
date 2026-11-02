'use client'

import { Presentation } from 'lucide-react'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { defineResourceTab } from '@/components/ministry/workspace/types'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'

// Marriage & Family: seminars. Counseling (counseling_services) is confidential pastoral care and is
// deliberately not part of this workspace. Overview, Members and Events come with MinistryWorkspace.

type Person = { id: string; first_name: string; last_name: string }
type Seminar = Tables<'marriage_seminars'> & { facilitator: Person | null }

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>

const seminars = defineResourceTab<Seminar>({
  key: 'seminars',
  label: 'Seminars',
  icon: Presentation,
  api: '/api/marriage-seminars',
  noun: 'seminar',
  searchPlaceholder: 'Search by title or place',
  describe: (s) => s.title,
  columns: [
    { key: 'title', header: 'Seminar', primary: true },
    { key: 'seminar_date', header: 'Date', cell: (s) => formatDate(s.seminar_date) ?? muted('To be set') },
    { key: 'location', header: 'Place' },
    { key: 'facilitator', header: 'Facilitator', cell: (s) => (s.facilitator ? memberName(s.facilitator) : muted('Not set')) },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Premarital preparation' },
    { name: 'seminar_date', label: 'Date', type: 'date', width: 'half' },
    { name: 'location', label: 'Place', type: 'text', width: 'half' },
    { name: 'facilitator_id', label: 'Facilitator', type: 'member' },
  ],
  empty: { title: 'No seminars planned yet.', description: 'Plan marriage and family seminars with their facilitator.' },
})

export default function MarriageFamilyPage() {
  return <MinistryWorkspace slug="marriage-family" tabs={[seminars]} />
}
