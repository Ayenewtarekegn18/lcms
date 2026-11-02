import { collectionRoutes } from '@/lib/api/collection'
import { baptism } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Baptism records (baptisms is staff-only under RLS).
//   GET ?search= (name of the baptized) &limit=&offset=   POST { baptism_date, member_id, officiating_elder_id?, location?, notes? }
const list = collectionRoutes({
  table: 'baptisms',
  roles: { read: STAFF, write: STAFF },
  create: baptism,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name), officiating:profiles!officiating_elder_id(id, first_name, last_name)',
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: { column: 'baptism_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
