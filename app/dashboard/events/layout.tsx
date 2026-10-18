import { requirePageRole } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'

// Server-side gate: roles not in PAGE_ACCESS.events are redirected to /dashboard.
// Row-level security still protects the data itself.
export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(...PAGE_ACCESS.events)
  return <>{children}</>
}
