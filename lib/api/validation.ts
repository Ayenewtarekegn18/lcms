import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Parse a JSON request body with a zod schema. Use `.strict()` object schemas so unknown
 * keys (role, is_admin, id, recorded_by_id, …) are rejected instead of written to the database.
 */
export async function parseBody<S extends z.ZodTypeAny>(req: Request, schema: S) {
  const parsed = schema.safeParse(await req.json().catch(() => undefined))
  if (!parsed.success) {
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid request', issues: parsed.error.flatten() }, { status: 400 }),
    } as const
  }
  return { data: parsed.data as z.output<S>, error: null } as const
}

// Forms send '' or null for "no value"; both become null.
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

/** Optional, nullable field: accepts the value, '', null or a missing key. */
export const opt = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(blankToNull, schema.nullable().optional())

export const text = (max = 500) => z.string().trim().min(1).max(max)
export const uuid = z.string().uuid()
export const date = z.string().date() // YYYY-MM-DD
export const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Expected HH:MM')
export const count = z.number().int().min(0).max(100_000)
export const amount = z.coerce.number().positive().max(1_000_000_000)

/** Route param → uuid, or null (respond 404). */
export function parseId(id: string) {
  return uuid.safeParse(id).success ? id : null
}

export const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404 })

/** `?limit=&offset=` → [from, to] for `.range()`. Default 200 rows, max 500. */
export function pageRange(searchParams: URLSearchParams, defaultLimit = 200) {
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '', 10) || defaultLimit, 1), 500)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '', 10) || 0, 0)
  return [offset, offset + limit - 1] as const
}

/**
 * Search text safe to embed in PostgREST filters: keeps letters in any script (Amharic too),
 * digits, spaces and @ . ' -; drops LIKE wildcards and filter syntax such as , ( ) %.
 */
export function cleanSearch(value: string | null | undefined, max = 100) {
  const s = (value ?? '').replace(/[^\p{L}\p{N}\s@.'-]/gu, '').trim().slice(0, max)
  return s || null
}
