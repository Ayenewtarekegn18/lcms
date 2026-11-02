'use client'

import { BookOpen, ClipboardCheck, GraduationCap, School } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AttendanceTab } from '@/components/ministry/children/attendance-tab'
import { CurriculumTab, TeachersTab, type ChildrenClass } from '@/components/ministry/children/class-tabs'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { defineResourceTab } from '@/components/ministry/workspace/types'

// Children's Ministry: classes, who teaches them, the curriculum and each class's attendance register.
// Classes is config only; Teachers and Curriculum are resource tabs with a class picker; Class
// attendance is a register (components/ministry/children).

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>

const classes = defineResourceTab<ChildrenClass>({
  key: 'classes',
  label: 'Classes',
  icon: School,
  api: '/api/children-classes',
  noun: 'class',
  searchPlaceholder: 'Search classes',
  describe: (c) => c.name,
  deleteNote: 'Its teachers and attendance records are deleted with it; its lessons stay, for all classes.',
  columns: [
    { key: 'name', header: 'Class', primary: true },
    { key: 'age_group', header: 'Ages', cell: (c) => (c.age_group ? <Badge variant="secondary">{c.age_group}</Badge> : muted('—')) },
    { key: 'schedule_text', header: 'When' },
    { key: 'location', header: 'Where' },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Little Lambs' },
    { name: 'age_group', label: 'Age group', type: 'text', maxLength: 50, placeholder: 'e.g. 4–6', width: 'half' },
    { name: 'schedule_text', label: 'When', type: 'text', placeholder: 'e.g. Sundays 10:00', width: 'half' },
    { name: 'location', label: 'Where', type: 'text', placeholder: 'e.g. Room 2' },
  ],
  empty: { title: 'No classes yet.', description: 'Add the classes children are taught in, by age group.' },
})

export default function ChildrenPage() {
  return (
    <MinistryWorkspace
      slug="children"
      tabs={[
        classes,
        { key: 'teachers', label: 'Teachers', icon: GraduationCap, render: (ctx) => <TeachersTab ctx={ctx} /> },
        { key: 'curriculum', label: 'Curriculum', icon: BookOpen, render: (ctx) => <CurriculumTab ctx={ctx} /> },
        { key: 'attendance', label: 'Class attendance', icon: ClipboardCheck, render: (ctx) => <AttendanceTab ctx={ctx} /> },
      ]}
    />
  )
}
