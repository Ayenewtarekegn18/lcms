import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { adminTaskCreate } from '@/lib/api/schemas'
import { TASK_STATUSES } from '@/lib/ministries/administration'
import { STAFF } from '@/lib/auth/roles'

// Administration tasks (admin_tasks is staff-only under RLS).
//   GET ?status= &search= (title, notes) &limit=&offset=   POST { title, assigned_to_id?, due_date?, status?, notes? }
const list = collectionRoutes({
  table: 'admin_tasks',
  roles: { read: STAFF, write: STAFF },
  create: adminTaskCreate,
  select: '*, assignee:profiles!assigned_to_id(id, first_name, last_name)',
  filters: { status: z.enum(TASK_STATUSES) },
  search: { columns: ['title', 'notes'] },
  // Soonest due first (tasks without a due date last), newest first among those.
  order: [{ column: 'due_date' }, { column: 'created_at', ascending: false }],
})
export const GET = list.GET
export const POST = list.POST
