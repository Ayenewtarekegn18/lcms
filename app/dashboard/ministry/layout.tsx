import React from "react"
import { Metadata } from 'next'
import { requirePageRole } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'

export const metadata: Metadata = {
  title: 'Ministry',
  description: 'Ministry Management',
}

// Server-side gate: roles not in PAGE_ACCESS.ministry are redirected to /dashboard.
export default async function MinistryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePageRole(...PAGE_ACCESS.ministry)
  return children
}
