import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { worshipEquipmentCreate } from '@/lib/api/schemas'
import { EQUIPMENT_STATUS_VALUES } from '@/lib/ministries/stage-worship'
import { STAFF } from '@/lib/auth/roles'

// Stage and sound equipment (RLS: worship_equipment is staff only).
//   GET ?status= &search= (name, description) &limit=&offset=   POST { name, description?, status? }
const list = collectionRoutes({
  table: 'worship_equipment',
  roles: { read: STAFF, write: STAFF },
  create: worshipEquipmentCreate,
  filters: { status: z.enum(EQUIPMENT_STATUS_VALUES) },
  search: { columns: ['name', 'description'] },
  order: { column: 'name' },
})
export const GET = list.GET
export const POST = list.POST
