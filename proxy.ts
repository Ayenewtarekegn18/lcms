import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Runs before every matched request: refreshes the Supabase session cookie and
// sends signed-out visitors away from /dashboard.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
