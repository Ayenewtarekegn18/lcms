import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { spiritualFollowUp } from '@/lib/api/schemas'
import { FOLLOW_UP_STATUSES, FOLLOW_UP_TYPES } from '@/lib/ministries/spiritual-service'
import { PASTORAL } from '@/lib/auth/roles'

// Pastoral follow-up notes are confidential: admin and elder only, for reading and writing (same as RLS).
//   GET ?search= (member's name) &status= &follow_up_type= &limit=&offset=
//   POST { member_id, follow_up_type, last_contact_date?, notes?, status? }
const list = collectionRoutes({
  table: 'spiritual_follow_ups',
  roles: { read: PASTORAL, write: PASTORAL },
  create: spiritualFollowUp,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name)',
  filters: { status: z.enum(FOLLOW_UP_STATUSES), follow_up_type: z.enum(FOLLOW_UP_TYPES) },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: { column: 'last_contact_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
