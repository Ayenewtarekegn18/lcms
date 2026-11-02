'use client'

import { BookOpen, Droplets, HeartHandshake, Sprout, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { defineResourceTab, type CustomTab } from '@/components/ministry/workspace/types'
import { PASTORAL } from '@/lib/auth/roles'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'
import {
  FOLLOW_UP_STATUS_OPTIONS, FOLLOW_UP_TYPE_OPTIONS, followUpStatusLabel, followUpTypeLabel,
} from '@/lib/ministries/spiritual-service'
import { CandidatesTab } from './candidates-tab'
import { ClassAttendanceTab, type SpiritualClass } from './class-attendance-tab'

// Spiritual Service: Overview, Members and Events come with MinistryWorkspace. Classes, baptisms and
// follow-ups are config; Attendance (per class) and Candidates (with a status filter) are custom tabs.
// Follow-ups are confidential: only admins and elders read or write them (RLS and the API agree).

type Person = { id: string; first_name: string; last_name: string }
type Baptism = Tables<'baptisms'> & { member: Person | null; officiating: Person | null }
type FollowUp = Tables<'spiritual_follow_ups'> & { member: Person | null }

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const person = (p: Person | null, fallback = 'Unknown member') => (p ? memberName(p) : fallback)
const keepHelp = 'Anyone in the member register.'

const classes = defineResourceTab<SpiritualClass>({
  key: 'classes',
  label: 'Classes',
  icon: BookOpen,
  api: '/api/spiritual-classes',
  noun: 'class',
  searchPlaceholder: 'Search classes by title or place',
  describe: (c) => c.title,
  deleteNote: 'Its attendance list goes with it. This cannot be undone.',
  columns: [
    { key: 'title', header: 'Class', primary: true },
    { key: 'class_date', header: 'Date', cell: (c) => formatDate(c.class_date) },
    { key: 'instructor', header: 'Instructor', cell: (c) => (c.instructor ? memberName(c.instructor) : muted('—')) },
    { key: 'location', header: 'Place' },
    { key: 'max_attendees', header: 'Seats', cell: (c) => c.max_attendees ?? muted('No limit') },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Salvation basics' },
    { name: 'class_date', label: 'Date', type: 'date', required: true, width: 'half' },
    { name: 'max_attendees', label: 'Seats', type: 'number', min: 0, max: 100_000, width: 'half', help: 'Leave empty for no limit.' },
    { name: 'location', label: 'Place', type: 'text' },
    { name: 'instructor_id', label: 'Instructor', type: 'member', help: keepHelp },
  ],
  empty: { title: 'No classes yet.', description: 'Schedule salvation and baptism preparation classes.' },
})

const attendance: CustomTab = { key: 'attendance', label: 'Attendance', icon: UserCheck, render: (ctx) => <ClassAttendanceTab ctx={ctx} /> }
const candidates: CustomTab = { key: 'candidates', label: 'Candidates', icon: Sprout, render: (ctx) => <CandidatesTab ctx={ctx} /> }

const baptisms = defineResourceTab<Baptism>({
  key: 'baptisms',
  label: 'Baptisms',
  icon: Droplets,
  api: '/api/baptisms',
  noun: 'baptism',
  searchPlaceholder: 'Search baptisms by name',
  describe: (b) => `Baptism of ${person(b.member)}`,
  columns: [
    { key: 'member', header: 'Baptized', primary: true, cell: (b) => person(b.member) },
    { key: 'baptism_date', header: 'Date', cell: (b) => formatDate(b.baptism_date) },
    { key: 'officiating', header: 'Officiated by', cell: (b) => (b.officiating ? memberName(b.officiating) : muted('—')) },
    { key: 'location', header: 'Place' },
    { key: 'notes', header: 'Notes', hideOnMobile: true, className: 'max-w-xs truncate' },
  ],
  fields: [
    { name: 'member_id', label: 'Baptized', type: 'member', required: true, createOnly: true },
    { name: 'baptism_date', label: 'Date', type: 'date', required: true, width: 'half' },
    { name: 'location', label: 'Place', type: 'text', width: 'half' },
    { name: 'officiating_elder_id', label: 'Officiated by', type: 'member', help: keepHelp },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  empty: { title: 'No baptisms recorded yet.', description: 'Record each baptism with its date and who officiated.' },
})

const followUps = defineResourceTab<FollowUp>({
  key: 'follow-ups',
  label: 'Follow-ups',
  icon: HeartHandshake,
  api: '/api/spiritual-follow-ups',
  write: PASTORAL,
  noun: 'follow-up',
  searchPlaceholder: 'Search follow-ups by name',
  describe: (f) => `Follow-up with ${person(f.member)}`,
  columns: [
    { key: 'member', header: 'Member', primary: true, cell: (f) => person(f.member) },
    { key: 'follow_up_type', header: 'Type', cell: (f) => followUpTypeLabel(f.follow_up_type) ?? f.follow_up_type },
    { key: 'last_contact_date', header: 'Last contact', cell: (f) => formatDate(f.last_contact_date) ?? muted('Not yet') },
    {
      key: 'status',
      header: 'Status',
      cell: (f) => (f.status === 'completed' ? <Badge>Completed</Badge> : <Badge variant="secondary">{followUpStatusLabel(f.status) ?? 'Ongoing'}</Badge>),
    },
    { key: 'notes', header: 'Notes', hideOnMobile: true, className: 'max-w-xs truncate' },
  ],
  fields: [
    { name: 'member_id', label: 'Member', type: 'member', required: true, createOnly: true },
    { name: 'follow_up_type', label: 'Type', type: 'select', required: true, options: FOLLOW_UP_TYPE_OPTIONS, defaultValue: 'post_salvation', width: 'half' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: FOLLOW_UP_STATUS_OPTIONS, defaultValue: 'ongoing', width: 'half' },
    { name: 'last_contact_date', label: 'Last contact', type: 'date', width: 'half' },
    { name: 'notes', label: 'Notes', type: 'textarea', help: 'Confidential: only admins and elders can see follow-ups.' },
  ],
  empty: {
    title: 'No follow-ups.',
    description: 'Follow-ups are confidential: admins and elders see and assign them here.',
  },
})

export default function SpiritualServicePage() {
  return <MinistryWorkspace slug="spiritual-service" tabs={[classes, attendance, candidates, baptisms, followUps]} />
}
