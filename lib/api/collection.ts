import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/lib/database.types'
import { requireRole, dbError } from '@/lib/auth/guards'
import type { Role } from '@/lib/auth/roles'
import { cleanSearch, pageRange, parseBody } from '@/lib/api/validation'

type Table = keyof Database['public']['Tables']

/** One `ORDER BY` term. Empty values sort last either way, and rows are always ordered by id last, so pages never overlap. */
export type OrderBy = { column: string; ascending?: boolean }

export type CollectionOptions<S extends z.ZodTypeAny> = {
  table: Table
  /** Who may list (read) and add (write). Keep in step with the table's RLS (docs/MINISTRY_WORKSPACES.md → Roles). */
  roles: { read: readonly Role[]; write: readonly Role[] }
  /** Strict schema of the fields a client may send on POST (unknown keys are refused). */
  create: S
  /** PostgREST select, e.g. '*, member:profiles!member_id(id, first_name, last_name)'. Default '*'. */
  select?: string
  /**
   * Query parameters allowed as `column = value` filters, each with the schema its value must match,
   * e.g. `{ ministry_id: uuid, status: z.enum(['open', 'closed']) }`. A bad value answers 400.
   */
  filters?: Record<string, z.ZodTypeAny>
  /** Filters that must be present (e.g. ['ministry_id'] for a list that only makes sense per ministry). */
  required?: readonly string[]
  /** Always applied `column = value` filters, e.g. `{ is_active: true }` for soft-deleted rows. */
  where?: Record<string, string | number | boolean>
  /**
   * `?search=` matches every word against these text columns (ILIKE). With `referencedTable` the
   * columns belong to an embedded resource; embed it with `!inner` in `select` so non-matches drop out.
   */
  search?: { columns: readonly string[]; referencedTable?: string }
  order?: OrderBy | readonly OrderBy[]
  /** Column set to the signed-in user's id on POST (e.g. 'created_by_id', 'recorded_by_id'). */
  owner?: string
  /** Server-owned values written on every POST (e.g. `{ is_active: true }`). */
  defaults?: Record<string, unknown>
  /** Upsert on these columns instead of insert (e.g. 'ministry_id,member_id' to re-add a removed member). */
  upsertOn?: string
  /** Rows per page when the client sends no ?limit (max 500). */
  pageSize?: number
}

const MAX_SEARCH_WORDS = 5

/**
 * PostgREST `or` filters for a search, one per word: every word must match one of the columns.
 * Pass text already cleaned by cleanSearch(), which drops , ( ) % and other filter syntax.
 */
export function searchFilters(columns: readonly string[], search: string | null | undefined): string[] {
  if (!columns.length) return []
  const words = (search ?? '').split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_WORDS)
  return words.map((word) => columns.map((column) => `${column}.ilike.%${word}%`).join(','))
}

/** The allowed filters present in the query string, validated; `error` names the first bad one. */
export function readFilters(
  searchParams: URLSearchParams,
  allowed: Record<string, z.ZodTypeAny> = {},
  required: readonly string[] = [],
): { values: Record<string, unknown>; error: string | null } {
  const values: Record<string, unknown> = {}
  for (const [name, schema] of Object.entries(allowed)) {
    const raw = searchParams.get(name)
    if (raw === null || raw === '') continue
    const parsed = schema.safeParse(raw)
    if (!parsed.success) return { values, error: `Invalid ${name}` }
    values[name] = parsed.data
  }
  const missing = required.find((name) => values[name] === undefined)
  return missing ? { values, error: `${missing} required` } : { values, error: null }
}

/**
 * GET (list) and POST (add) handlers for `/api/<resource>`; pair with itemRoutes() for `/[id]`.
 *
 *   const list = collectionRoutes({ table: 'choir_songs', roles: { read: ROLES, write: STAFF },
 *     create: choirSongCreate, search: { columns: ['title', 'composer'] }, order: { column: 'title' } })
 *   export const GET = list.GET
 *   export const POST = list.POST
 *
 * GET: `?limit=&offset=` page (pageRange), `?search=`, the configured filters; the number of matching
 * rows is in the X-Total-Count header. POST: role check, strict body, server-owned fields, 201 + row.
 * Row-level security still decides what each user may see and change.
 */
export function collectionRoutes<S extends z.ZodTypeAny>(options: CollectionOptions<S>) {
  // Generic over tables: the table name is checked against the schema, the payload by the zod
  // schema (a row type can't be expressed for "any table"); same approach as itemRoutes.
  const rows = (db: SupabaseClient<Database>) => (db as unknown as SupabaseClient).from(options.table)
  const select = options.select ?? '*'
  const order = options.order ? ([] as OrderBy[]).concat(options.order) : []

  async function GET(req: Request) {
    const auth = await requireRole(...options.roles.read)
    if (auth.error) return auth.error
    const { searchParams } = new URL(req.url)

    const filters = readFilters(searchParams, options.filters, options.required)
    if (filters.error) return NextResponse.json({ error: filters.error }, { status: 400 })

    let query = rows(auth.supabase).select(select, { count: 'exact' })
    for (const [column, value] of Object.entries({ ...options.where, ...filters.values })) query = query.eq(column, value)
    if (options.search) {
      const { columns, referencedTable } = options.search
      for (const f of searchFilters(columns, cleanSearch(searchParams.get('search')))) {
        query = referencedTable ? query.or(f, { referencedTable }) : query.or(f)
      }
    }
    for (const o of order) query = query.order(o.column, { ascending: o.ascending ?? true, nullsFirst: false })

    const { data, error, count } = await query.order('id').range(...pageRange(searchParams, options.pageSize))
    if (error) return dbError(error)
    const list = data ?? []
    return NextResponse.json(list, { headers: { 'X-Total-Count': String(count ?? list.length) } })
  }

  async function POST(req: Request) {
    const auth = await requireRole(...options.roles.write)
    if (auth.error) return auth.error
    const body = await parseBody(req, options.create)
    if (body.error) return body.error

    const values: Record<string, unknown> = { ...(body.data as Record<string, unknown>), ...options.defaults }
    if (options.owner) values[options.owner] = auth.user.id

    const table = rows(auth.supabase)
    const write = options.upsertOn ? table.upsert([values], { onConflict: options.upsertOn }) : table.insert([values])
    const { data, error } = await write.select(select).single()
    if (error) return dbError(error)
    return NextResponse.json(data, { status: 201 })
  }

  return { GET, POST }
}
