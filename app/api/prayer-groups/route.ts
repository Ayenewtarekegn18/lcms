import { collectionRoutes } from '@/lib/api/collection'
import { prayerGroupCreate } from '@/lib/api/schemas'
import { ROLES, STAFF } from '@/lib/auth/roles'

// Prayer groups: every signed-in user may read them, staff add and change them (RLS: prayer_groups is
// member-readable).   GET ?search= (name, description, schedule) &limit=&offset=
//   POST { name, description?, meeting_schedule? }
const list = collectionRoutes({
  table: 'prayer_groups',
  roles: { read: ROLES, write: STAFF },
  create: prayerGroupCreate,
  search: { columns: ['name', 'description', 'meeting_schedule'] },
  order: { column: 'name' },
})
export const GET = list.GET
export const POST = list.POST
