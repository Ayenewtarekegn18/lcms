import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/lib/database.types'
import { requireRole, dbError } from '@/lib/auth/guards'
import type { Role } from '@/lib/auth/roles'
import { parseBody, parseId, notFound } from '@/lib/api/validation'

type ItemContext = { params: Promise<{ id: string }> }
type Table = keyof Database['public']['Tables']

/**
 * PATCH and DELETE handlers for `/api/<resource>/[id]`.
 * Usage: `const item = itemRoutes({...}); export const PATCH = item.PATCH; export const DELETE = item.DELETE`
 * Both return 404 when the row doesn't exist or row-level security hides it.
 */
export function itemRoutes<S extends z.ZodTypeAny>(options: {
  table: Table
  roles: readonly Role[]
  /** Strict schema of the editable fields (every field optional). */
  update: S
  /** Deactivate (`is_active = false`) instead of deleting. */
  softDelete?: boolean
  /** Set updated_at explicitly (for databases without the updated_at trigger from remediation 04). */
  touchUpdatedAt?: boolean
}) {
  // Generic over tables: the table name is checked against the schema, the payload by the zod
  // schema above (a row type can't be expressed for "any table").
  const rows = (db: SupabaseClient<Database>) => (db as unknown as SupabaseClient).from(options.table)

  async function PATCH(req: Request, { params }: ItemContext) {
    const auth = await requireRole(...options.roles)
    if (auth.error) return auth.error
    const id = parseId((await params).id)
    if (!id) return notFound()

    const body = await parseBody(req, options.update)
    if (body.error) return body.error
    const updates: Record<string, unknown> = { ...(body.data as Record<string, unknown>) }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }
    if (options.touchUpdatedAt) updates.updated_at = new Date().toISOString()

    const { data, error } = await rows(auth.supabase).update(updates).eq('id', id).select().maybeSingle()
    if (error) return dbError(error)
    if (!data) return notFound()
    return NextResponse.json(data)
  }

  async function DELETE(_req: Request, { params }: ItemContext) {
    const auth = await requireRole(...options.roles)
    if (auth.error) return auth.error
    const id = parseId((await params).id)
    if (!id) return notFound()

    const table = rows(auth.supabase)
    const { data, error } = options.softDelete
      ? await table.update({ is_active: false }).eq('id', id).select('id')
      : await table.delete().eq('id', id).select('id')
    if (error) return dbError(error)
    if (!data?.length) return notFound()
    return NextResponse.json({ ok: true })
  }

  return { PATCH, DELETE }
}
