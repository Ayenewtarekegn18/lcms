import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { choirMemberCreate, VOICE_PARTS } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Choir voice parts (choir_members is staff-only under RLS): one row per singer.
//   GET ?search= (singer's name) &voice_part= &limit=&offset=   POST { member_id, voice_part?, join_date?, is_active? }
const list = collectionRoutes({
  table: 'choir_members',
  roles: { read: STAFF, write: STAFF },
  create: choirMemberCreate,
  select: '*, member:profiles!member_id!inner(id, first_name, last_name)',
  filters: { voice_part: z.enum(VOICE_PARTS) },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: [{ column: 'voice_part' }, { column: 'join_date', ascending: false }],
})
export const GET = list.GET
export const POST = list.POST
