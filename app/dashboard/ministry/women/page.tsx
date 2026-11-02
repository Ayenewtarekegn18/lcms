'use client'

import { CalendarHeart, GraduationCap, HandHeart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { defineResourceTab } from '@/components/ministry/workspace/types'
import { WOMEN_ACTIVITY_STATUS_OPTIONS, shortTime, womenActivityStatusLabel } from '@/lib/ministries/women'
import type { Tables } from '@/lib/database.types'
import { formatDate } from '@/lib/members/directory'

// Women's Ministry: Overview, Members (the registry, with leader / co-leader / member roles) and Events
// come with MinistryWorkspace; meetings with their minutes, service activities and trainings are config.

type Meeting = Tables<'women_meetings'>
type Activity = Tables<'women_activities'>
type Training = Tables<'women_trainings'>

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const whole = (n: number | null) => (n === null ? muted('—') : n.toLocaleString())

const meetings = defineResourceTab<Meeting>({
  key: 'meetings',
  label: 'Meetings',
  icon: CalendarHeart,
  api: '/api/women-meetings',
  noun: 'meeting',
  searchPlaceholder: 'Search meetings by title or place',
  describe: (m) => m.title,
  columns: [
    {
      key: 'title',
      header: 'Meeting',
      primary: true,
      cell: (m) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{m.title}</p>
          {m.minutes_text && <p className="truncate text-xs font-normal text-muted-foreground">Minutes recorded</p>}
        </div>
      ),
    },
    {
      key: 'meeting_date',
      header: 'When',
      cell: (m) => [formatDate(m.meeting_date), shortTime(m.meeting_time)].filter(Boolean).join(' · '),
    },
    { key: 'location', header: 'Place' },
    { key: 'attendees_count', header: 'Attended', cell: (m) => whole(m.attendees_count) },
    {
      key: 'minutes_text',
      header: 'Minutes',
      hideOnMobile: true,
      className: 'max-w-xs truncate',
      cell: (m) => m.minutes_text ?? muted('Not recorded'),
    },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Monthly fellowship' },
    { name: 'meeting_date', label: 'Date', type: 'date', required: true, width: 'half' },
    { name: 'meeting_time', label: 'Time', type: 'time', width: 'half' },
    { name: 'location', label: 'Place', type: 'text', width: 'half' },
    { name: 'attendees_count', label: 'Attended', type: 'number', min: 0, max: 100_000, width: 'half', help: 'After the meeting.' },
    { name: 'minutes_text', label: 'Minutes', type: 'textarea', maxLength: 20_000, help: 'What was discussed and decided.' },
  ],
  empty: { title: 'No meetings yet.', description: 'Schedule fellowship meetings and keep their minutes here.' },
})

const activityVariant = { proposed: 'outline', planned: 'secondary', completed: 'default' } as const

const activities = defineResourceTab<Activity>({
  key: 'activities',
  label: 'Activities',
  icon: HandHeart,
  api: '/api/women-activities',
  noun: 'activity',
  searchPlaceholder: 'Search activities',
  describe: (a) => a.title,
  columns: [
    { key: 'title', header: 'Activity', primary: true },
    { key: 'activity_date', header: 'Date', cell: (a) => formatDate(a.activity_date) ?? muted('Not set') },
    {
      key: 'status',
      header: 'Status',
      cell: (a) => {
        const label = womenActivityStatusLabel(a.status)
        if (!label) return muted('—')
        return <Badge variant={activityVariant[a.status as keyof typeof activityVariant]}>{label}</Badge>
      },
    },
    { key: 'volunteers_count', header: 'Volunteers', cell: (a) => whole(a.volunteers_count) },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Hospital visit' },
    { name: 'activity_date', label: 'Date', type: 'date', width: 'half' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: WOMEN_ACTIVITY_STATUS_OPTIONS, defaultValue: 'proposed', width: 'half' },
    { name: 'volunteers_count', label: 'Volunteers', type: 'number', min: 0, max: 100_000, width: 'half' },
  ],
  empty: { title: 'No activities yet.', description: 'Propose service activities and track them until they are done.' },
})

const trainings = defineResourceTab<Training>({
  key: 'trainings',
  label: 'Trainings',
  icon: GraduationCap,
  api: '/api/women-trainings',
  noun: 'training',
  searchPlaceholder: 'Search by title or instructor',
  describe: (t) => t.title,
  columns: [
    {
      key: 'title',
      header: 'Training',
      primary: true,
      cell: (t) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{t.title}</p>
          {t.description && <p className="line-clamp-2 text-xs font-normal text-muted-foreground md:max-w-sm">{t.description}</p>}
        </div>
      ),
    },
    { key: 'training_date', header: 'Date', cell: (t) => formatDate(t.training_date) ?? muted('Not set') },
    { key: 'instructor_name', header: 'Instructor' },
    { key: 'registered_count', header: 'Registered', cell: (t) => whole(t.registered_count) },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Biblical womanhood' },
    { name: 'training_date', label: 'Date', type: 'date', width: 'half' },
    { name: 'instructor_name', label: 'Instructor', type: 'text', width: 'half' },
    { name: 'registered_count', label: 'Registered', type: 'number', min: 0, max: 100_000, width: 'half' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  empty: { title: 'No trainings yet.', description: 'Add trainings and workshops for the women of the church.' },
})

export default function WomenMinistryPage() {
  return <MinistryWorkspace slug="women" tabs={[meetings, activities, trainings]} />
}
