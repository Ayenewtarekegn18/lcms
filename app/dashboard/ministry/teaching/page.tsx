'use client'

import { BookOpen, FileText, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { lookupResourceTab } from '@/components/ministry/workspace/lookup-resource-tab'
import { defineResourceTab } from '@/components/ministry/workspace/types'
import { choiceLabel } from '@/lib/ministries/options'
import { ENROLLMENT_STATUSES, MATERIAL_TYPES, PROGRAM_TYPES } from '@/lib/ministries/teaching'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'

// Teaching & Seminar: programs (courses, seminars, workshops), their materials and who is enrolled.
// Overview, Members and Events come with MinistryWorkspace.

type Person = { id: string; first_name: string; last_name: string }
type Program = Tables<'education_programs'> & { instructor: Person | null; enrollments?: { count: number }[] }
type Material = Tables<'teaching_materials'> & { program: { id: string; title: string } | null }
type Enrollment = Tables<'education_enrollments'> & { member: Person | null; program: { id: string; title: string } | null }

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const personName = (p: Person | null) => (p ? memberName(p) : null)

function programDates(p: Program) {
  const start = formatDate(p.start_date)
  const end = formatDate(p.end_date)
  return end ? `${start} – ${end}` : `From ${start}`
}

function seats(p: Program) {
  const n = p.enrollments?.[0]?.count ?? 0
  return p.max_capacity ? `${n} / ${p.max_capacity}` : String(n)
}

const programChoice = (p: Program) => ({ value: p.id, label: p.title })
const noPrograms = (what: string) => ({
  title: 'No programs yet.',
  description: `Add a course or seminar first, then ${what}.`,
  tab: 'programs',
  action: 'Go to Programs',
})

const programs = defineResourceTab<Program>({
  key: 'programs',
  label: 'Programs',
  icon: GraduationCap,
  api: '/api/education-programs',
  noun: 'program',
  searchPlaceholder: 'Search programs',
  describe: (p) => p.title,
  columns: [
    { key: 'title', header: 'Program', primary: true },
    { key: 'program_type', header: 'Type', cell: (p) => (p.program_type ? <Badge variant="secondary" className="whitespace-nowrap">{choiceLabel(PROGRAM_TYPES, p.program_type)}</Badge> : muted('—')) },
    { key: 'instructor', header: 'Instructor', cell: (p) => personName(p.instructor) ?? muted('Not set') },
    { key: 'dates', header: 'Dates', cell: programDates },
    { key: 'enrolled', header: 'Enrolled', className: 'whitespace-nowrap', cell: seats },
    { key: 'location', header: 'Place', hideOnMobile: true },
    { key: 'is_active', header: 'Status', cell: (p) => (p.is_active === false ? <Badge variant="outline">Closed</Badge> : <Badge>Open</Badge>) },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Foundations of Faith' },
    { name: 'program_type', label: 'Type', type: 'select', options: PROGRAM_TYPES, defaultValue: 'course', width: 'half' },
    { name: 'instructor_id', label: 'Instructor', type: 'member', width: 'half' },
    { name: 'start_date', label: 'Starts', type: 'date', required: true, width: 'half' },
    { name: 'end_date', label: 'Ends', type: 'date', width: 'half' },
    { name: 'duration_weeks', label: 'Length (weeks)', type: 'number', min: 1, max: 520, width: 'half' },
    { name: 'max_capacity', label: 'Capacity', type: 'number', min: 0, max: 100000, width: 'half', help: 'Leave empty for no limit.' },
    { name: 'location', label: 'Place', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'is_active', label: 'Open (shown to members)', type: 'checkbox', defaultValue: true },
  ],
  deleteNote: 'Its materials and enrollments are deleted with it. This cannot be undone.',
  empty: { title: 'No programs yet.', description: 'Add the courses, seminars and workshops the ministry teaches.' },
})

const materials = lookupResourceTab<Material, Program>(
  {
    key: 'materials',
    label: 'Materials',
    icon: FileText,
    api: '/api/teaching-materials',
    noun: 'material',
    searchPlaceholder: 'Search materials',
    describe: (m) => m.title,
    columns: [
      { key: 'title', header: 'Material', primary: true },
      { key: 'program', header: 'Program', cell: (m) => m.program?.title ?? muted('—') },
      { key: 'material_type', header: 'Type', cell: (m) => (m.material_type ? <Badge variant="secondary">{choiceLabel(MATERIAL_TYPES, m.material_type)}</Badge> : muted('—')) },
      {
        key: 'url',
        header: 'Link',
        cell: (m) => (m.url
          ? <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Open</a>
          : muted('—')),
      },
    ],
    fields: [
      { name: 'program_id', label: 'Program', type: 'select', required: true },
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Week 1 slides' },
      { name: 'material_type', label: 'Type', type: 'select', options: MATERIAL_TYPES, defaultValue: 'document', width: 'half' },
      { name: 'url', label: 'Link', type: 'url', placeholder: 'https://…', maxLength: 500 },
    ],
    empty: { title: 'No materials yet.', description: 'Link the slides, handouts and recordings of each program.' },
  },
  { field: 'program_id', api: '/api/education-programs', option: programChoice, missing: noPrograms('link its materials') },
)

const enrollments = lookupResourceTab<Enrollment, Program>(
  {
    key: 'enrollments',
    label: 'Enrollments',
    icon: BookOpen,
    api: '/api/education-enrollments',
    noun: 'enrollment',
    deleteVerb: 'Remove',
    searchPlaceholder: 'Search by name',
    describe: (e) => `${personName(e.member) ?? 'Unknown member'} in ${e.program?.title ?? 'a program'}`,
    columns: [
      { key: 'member', header: 'Name', primary: true, cell: (e) => personName(e.member) ?? muted('Unknown member') },
      { key: 'program', header: 'Program', cell: (e) => e.program?.title ?? muted('—') },
      { key: 'enrollment_date', header: 'Enrolled', cell: (e) => formatDate(e.enrollment_date) ?? muted('—') },
      {
        key: 'status',
        header: 'Status',
        cell: (e) => {
          const label = choiceLabel(ENROLLMENT_STATUSES, e.status)
          if (!label) return muted('—')
          return <Badge variant={e.status === 'completed' ? 'default' : e.status === 'dropped' ? 'outline' : 'secondary'}>{label}</Badge>
        },
      },
      { key: 'completion_date', header: 'Completed', cell: (e) => formatDate(e.completion_date) ?? muted('—'), hideOnMobile: true },
      { key: 'grade', header: 'Grade' },
    ],
    fields: [
      { name: 'program_id', label: 'Program', type: 'select', required: true, createOnly: true },
      { name: 'member_id', label: 'Member', type: 'member', required: true, createOnly: true },
      { name: 'enrollment_date', label: 'Enrolled', type: 'date', width: 'half', help: 'Leave empty for today.' },
      { name: 'status', label: 'Status', type: 'select', options: ENROLLMENT_STATUSES, defaultValue: 'active', width: 'half' },
      { name: 'completion_date', label: 'Completed', type: 'date', width: 'half' },
      { name: 'grade', label: 'Grade', type: 'text', maxLength: 50, width: 'half' },
    ],
    empty: { title: 'Nobody is enrolled yet.', description: 'Enroll members in a program and follow their progress.' },
  },
  { field: 'program_id', api: '/api/education-programs', option: programChoice, missing: noPrograms('enroll members') },
)

export default function TeachingPage() {
  return <MinistryWorkspace slug="teaching" tabs={[programs, materials, enrollments]} />
}
