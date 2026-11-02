'use client'

import { CalendarClock, Library, Mic } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { defineResourceTab } from '@/components/ministry/workspace/types'
import { CHOIR_SCHEDULE_TYPES, VOICE_PARTS } from '@/lib/ministries/choir'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'

// Neftalem Choir: the reference conversion for docs/MINISTRY_WORKSPACES.md. Overview, Members and
// Events come with MinistryWorkspace; the three tabs below are config only.

type Singer = Tables<'choir_members'> & { member: { id: string; first_name: string; last_name: string } | null }
type Song = Tables<'choir_songs'>
type Rehearsal = Tables<'choir_schedule'>

const singerName = (s: Singer) => (s.member ? memberName(s.member) : 'Unknown member')
const muted = (text: string) => <span className="text-muted-foreground">{text}</span>

const voiceParts = defineResourceTab<Singer>({
  key: 'voice-parts',
  label: 'Voice parts',
  icon: Mic,
  api: '/api/choir-members',
  noun: 'singer',
  searchPlaceholder: 'Search singers by name',
  describe: singerName,
  columns: [
    { key: 'name', header: 'Singer', primary: true, cell: singerName },
    { key: 'voice_part', header: 'Voice part', cell: (s) => (s.voice_part ? <Badge variant="secondary">{s.voice_part}</Badge> : muted('Not set')) },
    { key: 'join_date', header: 'Joined', cell: (s) => formatDate(s.join_date) ?? muted('—') },
    { key: 'is_active', header: 'Status', cell: (s) => (s.is_active === false ? <Badge variant="outline">On leave</Badge> : <Badge>Active</Badge>) },
  ],
  fields: [
    { name: 'member_id', label: 'Singer', type: 'member', required: true, createOnly: true },
    { name: 'voice_part', label: 'Voice part', type: 'select', options: VOICE_PARTS, width: 'half' },
    { name: 'join_date', label: 'Joined', type: 'date', width: 'half', help: 'Leave empty for today.' },
    { name: 'is_active', label: 'Active (not on leave)', type: 'checkbox', defaultValue: true },
  ],
  empty: { title: 'No singers yet.', description: 'Add choir members and their voice parts.' },
})

const songs = defineResourceTab<Song>({
  key: 'songs',
  label: 'Songs',
  icon: Library,
  api: '/api/choir-songs',
  noun: 'song',
  searchPlaceholder: 'Search by title or composer',
  describe: (s) => s.title,
  columns: [
    { key: 'title', header: 'Title', primary: true },
    { key: 'composer', header: 'Composer' },
    {
      key: 'lyrics_url',
      header: 'Lyrics',
      cell: (s) => (s.lyrics_url
        ? <a href={s.lyrics_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Open</a>
        : muted('—')),
    },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'composer', label: 'Composer', type: 'text' },
    { name: 'lyrics_url', label: 'Lyrics link', type: 'url', placeholder: 'https://…' },
  ],
  empty: { title: 'The song library is empty.', description: 'Add the songs the choir sings.' },
})

const schedule = defineResourceTab<Rehearsal>({
  key: 'schedule',
  label: 'Schedule',
  icon: CalendarClock,
  api: '/api/choir-schedule',
  noun: 'schedule entry',
  describe: (r) => `${r.event_type === 'performance' ? 'Performance' : 'Rehearsal'} on ${formatDate(r.event_date)}`,
  columns: [
    { key: 'event_date', header: 'Date', primary: true, cell: (r) => formatDate(r.event_date) },
    {
      key: 'event_type',
      header: 'Type',
      cell: (r) => (r.event_type ? <Badge variant={r.event_type === 'performance' ? 'default' : 'secondary'} className="capitalize">{r.event_type}</Badge> : muted('—')),
    },
    { key: 'location', header: 'Location' },
    { key: 'notes', header: 'Notes', className: 'max-w-xs truncate' },
  ],
  fields: [
    { name: 'event_date', label: 'Date', type: 'date', required: true, width: 'half' },
    { name: 'event_type', label: 'Type', type: 'select', options: CHOIR_SCHEDULE_TYPES.map((t) => ({ value: t, label: t === 'rehearsal' ? 'Rehearsal' : 'Performance' })), defaultValue: 'rehearsal', width: 'half' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  empty: { title: 'Nothing scheduled yet.', description: 'Plan rehearsals and performances.' },
})

export default function ChoirPage() {
  return <MinistryWorkspace slug="choir" tabs={[voiceParts, songs, schedule]} />
}
