import type { Tables } from '@/lib/database.types'
import type { EventItem, EventPayload } from '@/lib/events/schema'

// Browser calls to the events API (pages never query the database directly; guide step 2.1).

export type MinistryOption = Pick<Tables<'ministries'>, 'id' | 'name'>

/** A failed request, with a reason a person can act on. */
export class RequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

type ErrorBody = { error?: string; issues?: { fieldErrors?: Record<string, string[] | undefined> } } | null

export function failureReason(status: number, body: ErrorBody) {
  if (status === 401) return 'Your session has ended. Sign in again.'
  if (status === 403) return 'Your role is not allowed to do this.'
  if (status === 404) return 'It no longer exists. It may have been deleted.'
  if (status === 413) return 'Too much data in one request.'
  if (status === 400) {
    const first = Object.values(body?.issues?.fieldErrors ?? {}).find((m) => m?.length)?.[0]
    return first ?? 'Some details are not valid.'
  }
  return 'The server had a problem. Try again in a moment.'
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new RequestError('No connection to the server. Check the internet connection and try again.', 0)
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new RequestError(failureReason(res.status, body), res.status)
  return body as T
}

const json = (method: string, payload: unknown): RequestInit => ({ method, body: JSON.stringify(payload) })

export const eventsApi = {
  /** Query: from, to, order, limit, offset (see eventListQuery). */
  list: (query: Record<string, string>) => request<EventItem[]>(`/api/events?${new URLSearchParams(query)}`),
  create: (payload: EventPayload) => request<EventItem>('/api/events', json('POST', payload)),
  update: (id: string, payload: EventPayload) => request<Tables<'events'>>(`/api/events/${encodeURIComponent(id)}`, json('PATCH', payload)),
  remove: (id: string) => request<{ ok: true }>(`/api/events/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  ministries: () => request<MinistryOption[]>('/api/ministries?active=true'),
}

/** The text to show for a failed request. */
export const errorMessage = (err: unknown) => (err instanceof RequestError ? err.message : 'Something went wrong. Try again.')
