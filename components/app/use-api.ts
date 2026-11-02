'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { readApiError } from '@/lib/api/client-errors'

// Browser side of the API pattern (lib/api/collection.ts, lib/api/crud.ts): read a paged list, and send
// a change with a toast for the outcome. Pages never query the database directly.

export type ApiList<T> = {
  rows: T[]
  /** Matching rows on the server (X-Total-Count), for the pager. */
  total: number
  loading: boolean
  /** The last load failed (a toast said why); `rows` keeps what was there before. */
  failed: boolean
  offset: number
  setOffset: (offset: number) => void
  pageSize: number
  /** What the search box holds; the list follows it once typing pauses. */
  search: string
  setSearch: (search: string) => void
  reload: () => void
}

/**
 * A page of `GET path?params&search=&limit=&offset=`. Pass `path = null` to wait (e.g. until the
 * ministry id is known). Changing params or the search goes back to the first page.
 *
 *   const songs = useApiList<Song>('/api/choir-songs', { pageSize: 25 })
 *   <DataTable list={songs} … />
 */
export function useApiList<T>(
  path: string | null,
  { params, pageSize = 25, failure = 'Could not load the list.' }: { params?: Record<string, string>; pageSize?: number; failure?: string } = {},
): ApiList<T> {
  const [rows, setRows] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(path !== null)
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [version, setVersion] = useState(0)
  const paramKey = JSON.stringify(params ?? {})

  // Search on the server once typing pauses; a new search starts at the first page.
  useEffect(() => {
    const q = search.trim()
    if (q === query) return
    const timer = setTimeout(() => { setQuery(q); setOffset(0) }, 300)
    return () => clearTimeout(timer)
  }, [search, query])

  useEffect(() => { setOffset(0) }, [paramKey])

  useEffect(() => {
    if (!path) return
    const ctl = new AbortController()
    const qs = new URLSearchParams({ ...(JSON.parse(paramKey) as Record<string, string>), limit: String(pageSize), offset: String(offset) })
    if (query) qs.set('search', query)

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${path}?${qs}`, { signal: ctl.signal, cache: 'no-store' })
        if (!res.ok) {
          const { message } = await readApiError(res, failure)
          if (!ctl.signal.aborted) { setFailed(true); toast.error(message) }
          return
        }
        const data = (await res.json()) as T[]
        if (ctl.signal.aborted) return
        setRows(data)
        setTotal(Number(res.headers.get('X-Total-Count') ?? data.length) || data.length)
        setFailed(false)
      } catch {
        if (ctl.signal.aborted) return
        setFailed(true)
        toast.error(`${failure} Check your connection and try again.`)
      } finally {
        if (!ctl.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => ctl.abort()
  }, [path, paramKey, pageSize, offset, query, version, failure])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { rows, total, loading, failed, offset, setOffset, pageSize, search, setSearch, reload }
}

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors: Record<string, string> }

type MutationOptions = {
  method: 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Toast on success; leave out for none. */
  success?: string
  /** Toast title on failure, e.g. 'Could not add the song.' (the reason is added when the API gives one). */
  failure: string
}

/**
 * Send one change to the API. Shows a toast for the outcome and returns the field errors the API
 * reported (parseBody's issues), for a form to show next to its inputs.
 *
 *   const { mutate, pending } = useApiMutation()
 *   const r = await mutate<Song>('/api/choir-songs', { method: 'POST', body, success: 'Song added', failure: 'Could not add the song.' })
 */
export function useApiMutation() {
  const [pending, setPending] = useState(false)

  const mutate = useCallback(async <T = unknown>(url: string, o: MutationOptions): Promise<MutationResult<T>> => {
    setPending(true)
    try {
      const res = await fetch(url, {
        method: o.method,
        headers: o.body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: o.body === undefined ? undefined : JSON.stringify(o.body),
      })
      if (!res.ok) {
        const { message, fieldErrors } = await readApiError(res, o.failure)
        toast.error(message === o.failure && Object.keys(fieldErrors).length ? `${o.failure} Check the highlighted fields.` : message)
        return { ok: false, message, fieldErrors }
      }
      const data = (await res.json().catch(() => null)) as T
      if (o.success) toast.success(o.success)
      return { ok: true, data }
    } catch {
      const message = `${o.failure} Check your connection and try again.`
      toast.error(message)
      return { ok: false, message, fieldErrors: {} }
    } finally {
      setPending(false)
    }
  }, [])

  return { mutate, pending }
}
