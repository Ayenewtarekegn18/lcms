import { requirePageRole } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'

// Only registrars may open the form (the members section layout already requires staff).
export default async function RegisterMemberLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(...PAGE_ACCESS.registerMember)
  return <>{children}</>
}
