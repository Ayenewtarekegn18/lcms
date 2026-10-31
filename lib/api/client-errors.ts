// Browser side of the API pattern: turns a failed response from a route handler into a message for
// a toast and the field errors parseBody() reported (issues.fieldErrors), for the form to show.

type ErrorBody = { error?: unknown; issues?: { fieldErrors?: Record<string, string[] | undefined> } }

// dbError() and parseBody() answers that say nothing useful on their own; the caller's text is better.
const GENERIC = new Set(['Invalid request', 'Invalid data', 'Server error', 'Not found'])

export async function readApiError(res: Response, fallback: string) {
  const body = (await res.json().catch(() => null)) as ErrorBody | null
  const fieldErrors: Record<string, string> = {}
  for (const [field, messages] of Object.entries(body?.issues?.fieldErrors ?? {})) {
    if (messages?.[0]) fieldErrors[field] = messages[0]
  }

  let message = fallback
  if (res.status === 401) message = 'Your session has ended. Please sign in again.'
  else if (res.status === 403) message = 'You are not allowed to do that.'
  else if (res.status === 409) message = `${fallback} It already exists.`
  else if (typeof body?.error === 'string' && !GENERIC.has(body.error)) message = body.error
  return { message, fieldErrors }
}
