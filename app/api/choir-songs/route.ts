import { collectionRoutes } from '@/lib/api/collection'
import { choirSongCreate } from '@/lib/api/schemas'
import { ROLES, STAFF } from '@/lib/auth/roles'

// The choir's song library: every signed-in user may read it, staff add and change songs (RLS:
// choir_songs is member-readable).   GET ?search= (title, composer) &limit=&offset=   POST { title, composer?, lyrics_url? }
const list = collectionRoutes({
  table: 'choir_songs',
  roles: { read: ROLES, write: STAFF },
  create: choirSongCreate,
  search: { columns: ['title', 'composer'] },
  order: { column: 'title' },
})
export const GET = list.GET
export const POST = list.POST
