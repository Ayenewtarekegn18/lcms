'use client'

import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/language-selector'
import { LayoutDashboard, Users, Building2, Wallet, Calendar, FileText, Settings, LogOut } from 'lucide-react'

// Roles and sidebar access:
// - admin, elder: full access (all nav items).
// - ministry_leader: dashboard, members, calendar, communications, documents, reports, settings, ministries.
// - finance: dashboard, financial, reports, settings.
// - member: dashboard, calendar, settings only.
const ROLES = {
  admin: 'admin',
  elder: 'elder',
  ministry_leader: 'ministry_leader',
  finance: 'finance',
  member: 'member',
} as const

const CAN_SEE_FINANCIAL = [ROLES.admin, ROLES.elder, ROLES.finance]
const CAN_SEE_MEMBERS = [ROLES.admin, ROLES.elder, ROLES.ministry_leader]
const CAN_SEE_REPORTS = [ROLES.admin, ROLES.elder, ROLES.ministry_leader, ROLES.finance]
const CAN_SEE_COMMUNICATIONS = [ROLES.admin, ROLES.elder, ROLES.ministry_leader]
const CAN_SEE_DOCUMENTS = [ROLES.admin, ROLES.elder, ROLES.ministry_leader]
const CAN_SEE_AUDIT = [ROLES.admin, ROLES.elder]

interface SidebarProps {
  user: User
  role?: string
  isAdmin?: boolean
}

export function Sidebar({ user, role = 'member', isAdmin = false }: SidebarProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const allMainNavItems = [
    { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, roles: [ROLES.admin, ROLES.elder, ROLES.ministry_leader, ROLES.finance, ROLES.member] },
    { href: '/dashboard/members', labelKey: 'nav.members', icon: Users, roles: CAN_SEE_MEMBERS },
    { href: '/dashboard/calendar', labelKey: 'nav.calendar', icon: Calendar, roles: [ROLES.admin, ROLES.elder, ROLES.ministry_leader, ROLES.member] },
    { href: '/dashboard/financial', labelKey: 'nav.financial', icon: Wallet, roles: CAN_SEE_FINANCIAL },
    { href: '/dashboard/communications', labelKey: 'nav.communications', icon: FileText, roles: CAN_SEE_COMMUNICATIONS },
    { href: '/dashboard/documents', labelKey: 'nav.documents', icon: FileText, roles: CAN_SEE_DOCUMENTS },
    { href: '/dashboard/reports', labelKey: 'nav.reports', icon: FileText, roles: CAN_SEE_REPORTS },
    { href: '/dashboard/audit-log', labelKey: 'nav.auditLog', icon: FileText, roles: CAN_SEE_AUDIT },
    { href: '/dashboard/settings', labelKey: 'nav.settings', icon: Settings, roles: [ROLES.admin, ROLES.elder, ROLES.ministry_leader, ROLES.finance, ROLES.member] },
  ]

  // Admin and elder always see every nav item (full access). Others see items allowed for their role.
  const hasFullAccess = isAdmin || role === ROLES.admin || role === ROLES.elder
  const mainNavItems = hasFullAccess
    ? allMainNavItems
    : allMainNavItems.filter((item) => item.roles.includes(role as keyof typeof ROLES))

  const ministryItem = { href: '/dashboard/ministry', labelKey: 'nav.ministries', icon: Building2, roles: [ROLES.admin, ROLES.elder, ROLES.ministry_leader] as string[] }
  const ministryNavItems = (hasFullAccess || ministryItem.roles.includes(role)) ? [ministryItem] : []

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const navItems = [...mainNavItems, ...ministryNavItems]

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">{t('Sidebar.appName')}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('Sidebar.appTagline')}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(`Sidebar.${item.labelKey}`)}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <LanguageSelector />
        <div className="text-xs">
          <p className="text-slate-500">{t('Sidebar.account')}</p>
          <p className="font-medium text-slate-900 truncate mt-1">{user.email}</p>
        </div>
        <Button
          onClick={handleLogout}
          disabled={isLoading}
          variant="outline"
          className="w-full text-sm border-slate-300 hover:bg-slate-50 bg-transparent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoading ? t('Sidebar.loggingOut') : t('Sidebar.logout')}
        </Button>
      </div>
    </div>
  )
}
