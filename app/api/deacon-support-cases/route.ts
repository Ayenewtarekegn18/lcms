import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { deaconSupportCaseCreate } from '@/lib/api/schemas'
import { SUPPORT_CASE_STATUSES } from '@/lib/ministries/deacons'
import { PASTORAL } from '@/lib/auth/roles'

// Deacons' support cases are confidential (RLS: admin and elder read and write).
//   GET ?search= (member's name) &status= &limit=&offset=
//   POST { member_id, description, case_type?, status?, assigned_deacon_id? }
const list = collectionRoutes({
  table: 'deacon_support_cases',
  roles: { read: PASTORAL, write: PASTORAL },
  create: deaconSupportCaseCreate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name), deacon:profiles!assigned_deacon_id(id, first_name, last_name)',
  filters: { status: z.enum(SUPPORT_CASE_STATUSES) },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: [{ column: 'status', ascending: false }, { column: 'created_at', ascending: false }],
})
export const GET = list.GET
export const POST = list.POST
