import { requirePageRole } from '@/lib/auth/guards'
import { MEMBER_EDITORS, PAGE_ACCESS, type Role } from '@/lib/auth/roles'
import { MembersDirectory } from '@/components/members/directory/members-directory'

// The role decides which actions the directory offers; the API routes check it again, and RLS
// protects the data itself. Adding members is the registration page's job (+ Add Member).
export default async function MembersPage() {
  const { user, role } = await requirePageRole(...PAGE_ACCESS.members)
  const can = (roles: readonly Role[]) => role !== null && roles.includes(role)

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Members</h1>
        <p className="text-slate-500 mt-2">Manage church members and their information</p>
      </div>
      <MembersDirectory
        canEdit={can(MEMBER_EDITORS)}
        canRegister={can(PAGE_ACCESS.registerMember)}
        currentUserId={user?.id ?? ''}
      />
    </div>
  )
}
