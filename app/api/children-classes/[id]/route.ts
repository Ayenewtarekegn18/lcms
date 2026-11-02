import { itemRoutes } from '@/lib/api/crud'
import { childrenClassUpdate } from '@/lib/api/schemas'
import { STAFF } from '@/lib/auth/roles'

// Edit or delete a children's class (staff, like the children_classes write policies). Deleting a class
// deletes its teachers and attendance (ON DELETE CASCADE); its curriculum stays, without a class.
const item = itemRoutes({ table: 'children_classes', roles: STAFF, update: childrenClassUpdate })
export const PATCH = item.PATCH
export const DELETE = item.DELETE
