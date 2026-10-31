import { itemRoutes } from '@/lib/api/crud'
import { choirSongUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a song in the choir library (staff, like the choir_songs write policies).
const item = itemRoutes({ table: 'choir_songs', roles: STAFF, update: choirSongUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
