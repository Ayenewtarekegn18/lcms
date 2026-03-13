import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Only select 'is_admin' so this works even if 'role' column doesn't exist yet (migration 014).
  // Once you run 014, you can change to .select('role, is_admin') and use role for sidebar/API.
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const role = (profile as { role?: string } | null)?.role || 'member'
  const isAdmin = profile?.is_admin === true || role === 'admin' || role === 'elder'

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} role={role} isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto ml-64 bg-slate-50">
        {children}
      </main>
    </div>
  )
}
