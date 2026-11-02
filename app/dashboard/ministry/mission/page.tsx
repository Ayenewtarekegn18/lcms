'use client'

import { FileText, Plane, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LookupResourceTab, type Lookup } from '@/components/ministry/lookup-resource-tab'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { defineResourceTab, type CustomTab } from '@/components/ministry/workspace/types'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'
import { MISSION_TRIP_STATUS_OPTIONS, tripOptionLabel, tripStatusLabel } from '@/lib/ministries/mission'

// Mission Ministry: trips, who goes on them, and the reports written afterwards. Trips is config only;
// Participants and Reports pick their trip from the trips list (LookupResourceTab).

type Person = { id: string; first_name: string; last_name: string }
type TripRef = Pick<Tables<'mission_trips'>, 'id' | 'title' | 'trip_date'>
type Trip = Tables<'mission_trips'>
type Participant = Tables<'mission_trip_participants'> & { member: Person | null; trip: TripRef | null }
type Report = Tables<'mission_reports'> & { trip: TripRef | null; author: Person | null }

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const tripTitle = (t: TripRef | null) => t?.title ?? 'Unknown trip'
const participantName = (p: Participant) => (p.member ? memberName(p.member) : 'Unknown member')

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  planned: 'secondary',
  ongoing: 'default',
  completed: 'outline',
  cancelled: 'destructive',
}

const trips = defineResourceTab<Trip>({
  key: 'trips',
  label: 'Trips',
  icon: Plane,
  api: '/api/mission-trips',
  noun: 'trip',
  searchPlaceholder: 'Search trips by title or place',
  describe: (t) => t.title,
  columns: [
    { key: 'title', header: 'Trip', primary: true },
    { key: 'trip_date', header: 'Date', cell: (t) => formatDate(t.trip_date) ?? muted('Not set') },
    { key: 'location', header: 'Location' },
    {
      key: 'status',
      header: 'Status',
      cell: (t) => <Badge variant={STATUS_BADGE[t.status ?? 'planned'] ?? 'secondary'}>{tripStatusLabel(t.status)}</Badge>,
    },
    { key: 'description', header: 'Description', className: 'max-w-xs truncate', hideOnMobile: true },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'trip_date', label: 'Date', type: 'date', width: 'half' },
    { name: 'status', label: 'Status', type: 'select', options: MISSION_TRIP_STATUS_OPTIONS, defaultValue: 'planned', width: 'half' },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'Town or region' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Purpose, team, plans…' },
  ],
  deleteNote: 'Its participants and reports are deleted with it. This cannot be undone.',
  empty: { title: 'No mission trips yet.', description: 'Plan outreach and mission trips here.' },
})

// Shared by Participants and Reports: the trip picker and the "Trip" filter.
const tripLookup: Lookup<Trip> = {
  api: '/api/mission-trips',
  field: 'trip_id',
  option: (t) => ({ value: t.id, label: tripOptionLabel(t, formatDate) }),
  filterLabel: 'Trip',
  allLabel: 'All trips',
  missing: {
    title: 'Plan a trip first.',
    description: 'Participants and reports belong to a mission trip.',
    tab: 'trips',
    action: 'Add a trip',
  },
}

const participantsConfig = defineResourceTab<Participant>({
  key: 'participants',
  label: 'Participants',
  icon: UsersRound,
  api: '/api/mission-trip-participants',
  noun: 'participant',
  searchPlaceholder: 'Search participants by name',
  describe: participantName,
  deleteVerb: 'Remove',
  deleteNote: 'They can be added to the trip again later.',
  columns: [
    { key: 'name', header: 'Participant', primary: true, cell: participantName },
    { key: 'trip', header: 'Trip', cell: (p) => tripTitle(p.trip) },
    { key: 'trip_date', header: 'Trip date', cell: (p) => formatDate(p.trip?.trip_date) ?? muted('—'), hideOnMobile: true },
    { key: 'role', header: 'Role', cell: (p) => (p.role ? <Badge variant="secondary">{p.role}</Badge> : muted('Team member')) },
  ],
  fields: [
    { name: 'trip_id', label: 'Trip', type: 'select', required: true, createOnly: true },
    { name: 'member_id', label: 'Participant', type: 'member', required: true, createOnly: true },
    { name: 'role', label: 'Role on the trip', type: 'text', maxLength: 100, placeholder: 'Team leader, preacher, driver…' },
  ],
  empty: { title: 'No participants yet.', description: 'Add the members going on each trip.' },
})

const reportsConfig = defineResourceTab<Report>({
  key: 'reports',
  label: 'Reports',
  icon: FileText,
  api: '/api/mission-reports',
  noun: 'report',
  searchPlaceholder: 'Search report text',
  describe: (r) => `Report on ${tripTitle(r.trip)}${r.report_date ? ` (${formatDate(r.report_date)})` : ''}`,
  columns: [
    { key: 'trip', header: 'Trip', primary: true, cell: (r) => tripTitle(r.trip) },
    { key: 'report_date', header: 'Date', cell: (r) => formatDate(r.report_date) ?? muted('—') },
    { key: 'report_text', header: 'Report', className: 'max-w-md truncate', cell: (r) => <span className="line-clamp-3 whitespace-pre-line md:line-clamp-1">{r.report_text}</span> },
    { key: 'author', header: 'Written by', cell: (r) => (r.author ? memberName(r.author) : muted('—')), hideOnMobile: true },
  ],
  fields: [
    { name: 'trip_id', label: 'Trip', type: 'select', required: true },
    { name: 'report_date', label: 'Date', type: 'date', width: 'half', help: 'Leave empty for today.' },
    { name: 'report_text', label: 'Report', type: 'textarea', required: true, maxLength: 20000, placeholder: 'What happened, who was reached, what comes next…' },
  ],
  empty: { title: 'No reports yet.', description: 'Write up each trip when the team is back.' },
})

const participants: CustomTab = {
  key: participantsConfig.key,
  label: participantsConfig.label,
  icon: participantsConfig.icon,
  render: (ctx) => <LookupResourceTab ctx={ctx} config={participantsConfig} lookup={tripLookup} />,
}

const reports: CustomTab = {
  key: reportsConfig.key,
  label: reportsConfig.label,
  icon: reportsConfig.icon,
  render: (ctx) => <LookupResourceTab ctx={ctx} config={reportsConfig} lookup={tripLookup} />,
}

export default function MissionPage() {
  return <MinistryWorkspace slug="mission" tabs={[trips, participants, reports]} />
}
