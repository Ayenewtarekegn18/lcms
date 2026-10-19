import React from "react"
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
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

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} role={role ?? 'member'} />
      <main className="flex-1 overflow-auto ml-64 bg-slate-50">
        {children}
      </main>
    </div>
  )
}
