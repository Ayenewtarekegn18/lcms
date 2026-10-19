import { requirePageRole } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'

// Server-side gate: roles not in PAGE_ACCESS.reports are redirected to /dashboard.
// Row-level security still protects the data itself.
export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(...PAGE_ACCESS.reports)
  return <>{children}</>
}
