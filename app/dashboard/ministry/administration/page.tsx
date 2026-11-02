'use client'

import { AlertTriangle, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { defineResourceTab } from '@/components/ministry/workspace/types'
import { churchToday } from '@/lib/financial/summary'
import { isOverdue, TASK_STATUS_OPTIONS, taskStatusLabel } from '@/lib/ministries/administration'
import type { Tables } from '@/lib/database.types'
import { formatDate, memberName } from '@/lib/members/directory'

// Administration ministry: Overview, Members and Events come with MinistryWorkspace; Tasks is config
// on admin_tasks (staff-only under RLS, like the route).

type Person = { id: string; first_name: string; last_name: string }
type Task = Tables<'admin_tasks'> & { assignee: Person | null }

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const statusVariant = { pending: 'outline', in_progress: 'secondary', completed: 'default' } as const

function StatusBadge({ status }: { status: string | null }) {
  const variant = statusVariant[(status ?? 'pending') as keyof typeof statusVariant] ?? 'outline'
  return <Badge variant={variant} className="whitespace-nowrap">{taskStatusLabel(status)}</Badge>
}

function DueDate({ task }: { task: Task }) {
  if (!task.due_date) return muted('No due date')
  if (!isOverdue(task, churchToday())) return <span className="whitespace-nowrap">{formatDate(task.due_date)}</span>
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 font-medium text-destructive">
      <span className="whitespace-nowrap">{formatDate(task.due_date)}</span>
      <Badge variant="outline" className="gap-1 whitespace-nowrap border-destructive/40 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-3" aria-hidden /> Overdue
      </Badge>
    </span>
  )
}

const tasks = defineResourceTab<Task>({
  key: 'tasks',
  label: 'Tasks',
  icon: ClipboardList,
  api: '/api/admin-tasks',
  noun: 'task',
  searchPlaceholder: 'Search tasks',
  describe: (t) => t.title,
  columns: [
    {
      key: 'title',
      header: 'Task',
      primary: true,
      cell: (t) => (
        <span className={t.status === 'completed' ? 'text-muted-foreground line-through decoration-muted-foreground/50' : undefined}>
          {t.title}
        </span>
      ),
    },
    { key: 'assignee', header: 'Assigned to', cell: (t) => (t.assignee ? memberName(t.assignee) : muted('Unassigned')) },
    { key: 'due_date', header: 'Due', cell: (t) => <DueDate task={t} /> },
    { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
    { key: 'notes', header: 'Notes', hideOnMobile: true, className: 'max-w-xs truncate' },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'assigned_to_id', label: 'Assigned to', type: 'member', help: 'Anyone in the member register.' },
    { name: 'due_date', label: 'Due', type: 'date', width: 'half' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: TASK_STATUS_OPTIONS, defaultValue: 'pending', width: 'half' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  empty: { title: 'No tasks yet.', description: 'Add the jobs the office needs to get done, with who does them and by when.' },
})

export default function AdministrationPage() {
  return <MinistryWorkspace slug="administration" tabs={[tasks]} />
}
