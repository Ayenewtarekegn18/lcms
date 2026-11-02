'use client'

import { useId, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, School } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/app/empty-state'
import { selectClass } from '@/components/app/entity-form-dialog'
import { useApiList } from '@/components/app/use-api'
import { ResourceTab } from '@/components/ministry/workspace/resource-tab'
import { defineResourceTab, type ResourceTabConfig, type WorkspaceContext } from '@/components/ministry/workspace/types'
import type { Tables } from '@/lib/database.types'
import type { FieldOption } from '@/lib/forms/fields'
import { memberName } from '@/lib/members/directory'
import { TEACHER_ROLE_OPTIONS, teacherRoleLabel } from '@/lib/ministries/children'

// The Children's Ministry tabs whose rows belong to a class: Teachers and Curriculum. Both are ordinary
// resource tabs; the wrapper loads the classes for the form's class picker and a class filter.

export type ChildrenClass = Tables<'children_classes'>
type Person = { id: string; first_name: string; last_name: string }
type ClassRef = { id: string; name: string } | null
type Teacher = Tables<'children_class_teachers'> & { member: Person | null; class: ClassRef }
type Lesson = Tables<'children_curriculum'> & { class: ClassRef }

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>

/** Every class, for pickers (a church has a handful; one page of 200 is all of them). */
export function useChildrenClasses() {
  const list = useApiList<ChildrenClass>('/api/children-classes', { pageSize: 200, failure: 'Could not load the classes.' })
  const options = useMemo<FieldOption[]>(() => list.rows.map((c) => ({ value: c.id, label: c.name })), [list.rows])
  return { list, options }
}

/** A "Class" select: all classes (value '') or one. */
export function ClassFilter({ value, onChange, options, allLabel }: { value: string; onChange: (v: string) => void; options: FieldOption[]; allLabel?: string }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <Label htmlFor={id} className="text-sm text-muted-foreground">Class</Label>
      <select id={id} className={`${selectClass} bg-card sm:w-64`} value={value} onChange={(e) => onChange(e.target.value)}>
        {allLabel !== undefined && <option value="">{allLabel}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

/** Shown on a class tab while there is no class to attach rows to. */
export function NoClassesYet({ ctx, loading, what }: { ctx: WorkspaceContext; loading: boolean; what: string }) {
  if (loading) return <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <EmptyState
        icon={School}
        title="Add a class first."
        description={`${what} belong to a class. Create the ministry's classes on the Classes tab.`}
        action={<Button variant="outline" onClick={() => ctx.openTab('classes')}>Go to classes</Button>}
      />
    </div>
  )
}

function teachersTab(classes: FieldOption[], classId: string): ResourceTabConfig {
  const name = (t: Teacher) => (t.member ? memberName(t.member) : 'Unknown member')
  return defineResourceTab<Teacher>({
    key: 'teachers',
    label: 'Teachers',
    icon: GraduationCap,
    api: '/api/children-class-teachers',
    params: classId ? { class_id: classId } : undefined,
    noun: 'teacher',
    searchPlaceholder: 'Search teachers by name',
    describe: (t) => `${name(t)}${t.class ? ` (${t.class.name})` : ''}`,
    deleteVerb: 'Remove',
    deleteNote: 'They stay in the member register and can be added again.',
    columns: [
      { key: 'name', header: 'Teacher', primary: true, cell: name },
      { key: 'class', header: 'Class', cell: (t) => t.class?.name ?? muted('—') },
      {
        key: 'role',
        header: 'Role',
        cell: (t) => (t.role
          ? <Badge variant={t.role === 'lead' ? 'default' : 'secondary'}>{teacherRoleLabel(t.role)}</Badge>
          : muted('Not set')),
      },
    ],
    fields: [
      { name: 'member_id', label: 'Teacher', type: 'member', required: true, createOnly: true, help: 'Anyone in the member register.' },
      { name: 'class_id', label: 'Class', type: 'select', required: true, options: classes, defaultValue: classId || classes[0]?.value, width: 'half' },
      { name: 'role', label: 'Role', type: 'select', options: TEACHER_ROLE_OPTIONS, defaultValue: 'lead', width: 'half' },
    ],
    empty: classId
      ? { title: 'No teachers in this class yet.', description: 'Add the people who teach it.' }
      : { title: 'No teachers yet.', description: 'Add the people who teach each class.' },
  })
}

function curriculumTab(classes: FieldOption[], classId: string): ResourceTabConfig {
  return defineResourceTab<Lesson>({
    key: 'curriculum',
    label: 'Curriculum',
    icon: BookOpen,
    api: '/api/children-curriculum',
    params: classId ? { class_id: classId } : undefined,
    noun: 'lesson',
    searchPlaceholder: 'Search lessons',
    describe: (l) => l.title,
    columns: [
      { key: 'title', header: 'Lesson', primary: true },
      { key: 'class', header: 'Class', cell: (l) => l.class?.name ?? muted('All classes') },
      { key: 'description', header: 'Description', className: 'max-w-sm truncate', cell: (l) => l.description || muted('—') },
      {
        key: 'url',
        header: 'Material',
        cell: (l) => (l.url
          ? <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Open</a>
          : muted('—')),
      },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'class_id', label: 'Class', type: 'select', options: classes, defaultValue: classId || undefined, help: 'Leave empty for a lesson every class uses.' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'url', label: 'Material link', type: 'url', placeholder: 'https://…' },
    ],
    empty: classId
      ? { title: 'No lessons for this class yet.', description: 'Add lesson plans and links to the material.' }
      : { title: 'The curriculum is empty.', description: 'Add lesson plans and links to the material.' },
  })
}

export function TeachersTab({ ctx }: { ctx: WorkspaceContext }) {
  const { list, options } = useChildrenClasses()
  const [classId, setClassId] = useState('')
  const config = useMemo(() => teachersTab(options, classId), [options, classId])
  if (options.length === 0) return <NoClassesYet ctx={ctx} loading={list.loading} what="Teachers" />
  return (
    <div className="space-y-4">
      <ClassFilter value={classId} onChange={setClassId} options={options} allLabel="All classes" />
      <ResourceTab config={config} ctx={ctx} />
    </div>
  )
}

export function CurriculumTab({ ctx }: { ctx: WorkspaceContext }) {
  const { list, options } = useChildrenClasses()
  const [classId, setClassId] = useState('')
  const config = useMemo(() => curriculumTab(options, classId), [options, classId])
  // Wait for the classes: a form opened before they arrive would be reset when its class options change.
  if (list.loading && options.length === 0) return <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
  return (
    <div className="space-y-4">
      {options.length > 0 && <ClassFilter value={classId} onChange={setClassId} options={options} allLabel="All classes" />}
      <ResourceTab config={config} ctx={ctx} />
    </div>
  )
}
