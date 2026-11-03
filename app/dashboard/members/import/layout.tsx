import { requirePageRole } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'

// Importing is registering: only registrars (the members section layout already requires staff).
export default async function ImportMembersLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(...PAGE_ACCESS.registerMember)
  return <>{children}</>
}
