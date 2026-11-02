import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { womenActivity } from '@/lib/api/schemas'
import { WOMEN_ACTIVITY_STATUSES } from '@/lib/ministries/women'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Women's Ministry service activities (women_activities is member-readable under RLS; staff write).
//   GET ?search= (title) &status= &limit=&offset=   POST { title, activity_date?, status?, volunteers_count? }
const list = collectionRoutes({
  table: 'women_activities',
  roles: { read: ROLES, write: STAFF },
  create: womenActivity,
  filters: { status: z.enum(WOMEN_ACTIVITY_STATUSES) },
  search: { columns: ['title'] },
  order: { column: 'activity_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
