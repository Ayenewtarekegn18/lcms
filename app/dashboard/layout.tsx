import React from "react"
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { SkipLink } from '@/components/skip-link'
import { getSession } from '@/lib/auth/guards'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role, inactive } = await getSession()

  if (!user) {
    redirect('/auth/login')
  }
  if (inactive) {
    redirect(`/auth/error?error=${encodeURIComponent('This account has been deactivated. Please contact a church administrator.')}`)
  }

  // Desktop (md+): fixed sidebar, content offset by its width. Phones: a sticky top bar inside
  // <main> opens the same navigation in a drawer; scroll-padding keeps focused fields below the bar.
  return (
    <div className="flex h-dvh bg-slate-50">
      <SkipLink />
      <Sidebar user={user} role={role ?? 'member'} />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-w-0 overflow-auto md:ml-64 bg-slate-50 scroll-pt-14 md:scroll-pt-0 focus:outline-none"
      >
        <MobileNav user={user} role={role ?? 'member'} />
        {children}
      </main>
    </div>
  )
}
