// Administration values shared by the API schemas (lib/api/schemas.ts) and the administration page.
// No server code here.

/** admin_tasks.status (column default 'pending'). */
export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

const STATUS_LABELS: Record<TaskStatus, string> = { pending: 'Pending', in_progress: 'In progress', completed: 'Completed' }

export const TASK_STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))

const isTaskStatus = (s: unknown): s is TaskStatus => (TASK_STATUSES as readonly unknown[]).includes(s)

/** The status in words; rows written before the statuses were fixed show as they are. */
export const taskStatusLabel = (status: string | null | undefined) =>
  isTaskStatus(status) ? STATUS_LABELS[status] : status?.trim() || STATUS_LABELS.pending

/** A task is overdue when its due day has passed (`today` is YYYY-MM-DD in church time) and it isn't completed. */
export function isOverdue(task: { due_date: string | null; status: string | null }, today: string): boolean {
  if (!task.due_date || task.status === 'completed') return false
  return task.due_date.slice(0, 10) < today
}
