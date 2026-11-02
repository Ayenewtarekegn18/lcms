import { collectionRoutes } from '@/lib/api/collection'
import { worshipRehearsalCreate } from '@/lib/api/schemas'
import { uuid } from '@/lib/api/validation'
import { STAFF } from '@/lib/auth/roles'

// Rehearsals, each optionally for one worship service (RLS: worship_rehearsals is staff only).
//   GET ?event_id= &search= (notes) &limit=&offset=   POST { rehearsal_date, event_id?, notes? }
const list = collectionRoutes({
  table: 'worship_rehearsals',
  roles: { read: STAFF, write: STAFF },
  create: worshipRehearsalCreate,
  select: '*, event:worship_events!event_id(id, title, event_date)',
  filters: { event_id: uuid },
  search: { columns: ['notes'] },
  order: { column: 'rehearsal_date', ascending: false },
})
export const GET = list.GET
export const POST = list.POST
