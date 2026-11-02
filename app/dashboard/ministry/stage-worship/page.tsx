'use client'

import { CalendarDays, CalendarClock, Speaker, UserRound, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { linkedResourceTab } from '@/components/ministry/workspace/linked-resource-tab'
import { defineResourceTab } from '@/components/ministry/workspace/types'
import { choiceLabel } from '@/lib/ministries/options'
import { EQUIPMENT_STATUSES, WORSHIP_TYPES } from '@/lib/ministries/stage-worship'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'

// Stage & Worship: services, the teams that lead them and who serves on each, rehearsals and the stage
// equipment. Overview, Members and Events come with MinistryWorkspace.

type Person = { id: string; first_name: string; last_name: string }
type Service = Tables<'worship_events'> & { leader: Person | null }
type Team = Tables<'worship_teams'> & { members?: { count: number }[] }
type TeamMember = Tables<'worship_team_members'> & { member: Person | null; team: { id: string; name: string } | null }
type Rehearsal = Tables<'worship_rehearsals'> & { event: { id: string; title: string; event_date: string } | null }
type Equipment = Tables<'worship_equipment'>

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const personName = (p: Person | null) => (p ? memberName(p) : null)
const songCount = (list: string | null) => {
  const n = (list ?? '').split('\n').filter((line) => line.trim()).length
  return n ? `${n} ${n === 1 ? 'song' : 'songs'}` : muted('—')
}
const serviceLabel = (s: { title: string; event_date: string }) => `${s.title} · ${formatDate(s.event_date)}`

const services = defineResourceTab<Service>({
  key: 'services',
  label: 'Services',
  icon: CalendarDays,
  api: '/api/worship-events',
  noun: 'service',
  searchPlaceholder: 'Search by title or place',
  describe: (s) => serviceLabel(s),
  columns: [
    { key: 'title', header: 'Service', primary: true },
    { key: 'event_date', header: 'Date', className: 'whitespace-nowrap', cell: (s) => formatDate(s.event_date) },
    {
      key: 'worship_type',
      header: 'Type',
      cell: (s) => (s.worship_type ? <Badge variant="secondary" className="whitespace-nowrap">{choiceLabel(WORSHIP_TYPES, s.worship_type)}</Badge> : muted('—')),
    },
    { key: 'leader', header: 'Worship leader', cell: (s) => personName(s.leader) ?? muted('Not set') },
    { key: 'location', header: 'Place', hideOnMobile: true },
    { key: 'songs_list', header: 'Songs', hideOnMobile: true, className: 'whitespace-nowrap', cell: (s) => songCount(s.songs_list) },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Sunday morning worship' },
    { name: 'event_date', label: 'Date', type: 'date', required: true, width: 'half' },
    { name: 'worship_type', label: 'Type', type: 'select', options: WORSHIP_TYPES, defaultValue: 'sunday_service', width: 'half' },
    { name: 'worship_leader_id', label: 'Worship leader', type: 'member' },
    { name: 'location', label: 'Place', type: 'text', placeholder: 'e.g. Main sanctuary' },
    { name: 'songs_list', label: 'Songs', type: 'textarea', help: 'One song per line, in order.' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'notes', label: 'Notes for the team', type: 'textarea' },
  ],
  empty: { title: 'No services planned yet.', description: 'Plan worship services with their leader and songs.' },
})

const teams = defineResourceTab<Team>({
  key: 'teams',
  label: 'Teams',
  icon: UsersRound,
  api: '/api/worship-teams',
  noun: 'team',
  searchPlaceholder: 'Search teams',
  describe: (t) => t.name,
  columns: [
    { key: 'name', header: 'Team', primary: true },
    { key: 'description', header: 'Description', className: 'max-w-md truncate' },
    {
      key: 'members',
      header: 'People',
      cell: (t) => {
        const n = t.members?.[0]?.count ?? 0
        return n ? `${n} ${n === 1 ? 'person' : 'people'}` : muted('Nobody yet')
      },
    },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Team A, Sound and media' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  deleteNote: 'Its member list is deleted with it. This cannot be undone.',
  empty: { title: 'No worship teams yet.', description: 'Create the teams that lead worship, then add who serves on them.' },
})

const teamMembers = linkedResourceTab<TeamMember, Team>(
  {
    key: 'team-members',
    label: 'Team members',
    icon: UserRound,
    api: '/api/worship-team-members',
    noun: 'team member',
    deleteVerb: 'Remove',
    searchPlaceholder: 'Search by name',
    describe: (m) => personName(m.member) ?? 'Unknown member',
    columns: [
      { key: 'member', header: 'Name', primary: true, cell: (m) => personName(m.member) ?? muted('Unknown member') },
      { key: 'team', header: 'Team', cell: (m) => m.team?.name ?? muted('—') },
      { key: 'role', header: 'Serves as', cell: (m) => m.role ?? muted('Not set') },
    ],
    fields: [
      { name: 'team_id', label: 'Team', type: 'select', required: true, createOnly: true },
      { name: 'member_id', label: 'Member', type: 'member', required: true, createOnly: true },
      { name: 'role', label: 'Serves as', type: 'text', maxLength: 100, placeholder: 'e.g. Worship leader, Keyboard, Sound' },
    ],
    empty: { title: 'Nobody is on a team yet.', description: 'Add the singers, musicians and technicians of each team.' },
  },
  {
    field: 'team_id',
    api: '/api/worship-teams',
    option: (t) => ({ value: t.id, label: t.name }),
    none: { title: 'No worship teams yet.', description: 'Create a team first, then add the people who serve on it.', tab: 'teams', action: 'Go to Teams' },
  },
)

const rehearsals = linkedResourceTab<Rehearsal, Service>(
  {
    key: 'rehearsals',
    label: 'Rehearsals',
    icon: CalendarClock,
    api: '/api/worship-rehearsals',
    noun: 'rehearsal',
    searchPlaceholder: 'Search notes',
    describe: (r) => `Rehearsal on ${formatDate(r.rehearsal_date)}`,
    columns: [
      { key: 'rehearsal_date', header: 'Date', primary: true, className: 'whitespace-nowrap', cell: (r) => formatDate(r.rehearsal_date) },
      { key: 'event', header: 'For service', cell: (r) => (r.event ? serviceLabel(r.event) : muted('General rehearsal')) },
      { key: 'notes', header: 'Notes', className: 'max-w-xs truncate' },
    ],
    fields: [
      { name: 'rehearsal_date', label: 'Date', type: 'date', required: true, width: 'half' },
      { name: 'event_id', label: 'For service', type: 'select', width: 'half', help: 'Leave empty for a general rehearsal.' },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Time, place, songs to practise…' },
    ],
    empty: { title: 'No rehearsals planned yet.', description: 'Plan rehearsals, for a service or in general.' },
  },
  { field: 'event_id', api: '/api/worship-events', option: (s) => ({ value: s.id, label: serviceLabel(s) }) },
)

const equipment = defineResourceTab<Equipment>({
  key: 'equipment',
  label: 'Equipment',
  icon: Speaker,
  api: '/api/worship-equipment',
  noun: 'equipment item',
  searchPlaceholder: 'Search equipment',
  describe: (e) => e.name,
  columns: [
    { key: 'name', header: 'Item', primary: true },
    {
      key: 'status',
      header: 'Status',
      cell: (e) => {
        const label = choiceLabel(EQUIPMENT_STATUSES, e.status)
        if (!label) return muted('—')
        if (e.status === 'in_repair') return <Badge variant="outline" className="border-destructive/40 text-destructive">{label}</Badge>
        return <Badge variant={e.status === 'available' ? 'default' : 'outline'}>{label}</Badge>
      },
    },
    { key: 'description', header: 'Description', className: 'max-w-md truncate' },
  ],
  fields: [
    { name: 'name', label: 'Item', type: 'text', required: true, placeholder: 'e.g. Yamaha keyboard, Shure SM58 (x4)' },
    { name: 'status', label: 'Status', type: 'select', options: EQUIPMENT_STATUSES, defaultValue: 'available', width: 'half' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Where it is kept, serial number, condition…' },
  ],
  empty: { title: 'No equipment listed yet.', description: 'Keep track of instruments, microphones and sound gear.' },
})

export default function StageWorshipPage() {
  return <MinistryWorkspace slug="stage-worship" tabs={[services, teams, teamMembers, rehearsals, equipment]} />
}
