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
import { PAGE_ACCESS, ROLES, type Role } from '@/lib/auth/roles'

// Which links each role sees comes from PAGE_ACCESS, the same table the
// server-side section layouts enforce. Hiding a link is only a convenience.
interface SidebarProps {
  user: User
  role: Role
}

export function Sidebar({ user, role }: SidebarProps) {
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

  const allNavItems: { href: string; labelKey: string; icon: typeof LayoutDashboard; roles: readonly Role[] }[] = [
    { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, roles: ROLES },
    { href: '/dashboard/members', labelKey: 'nav.members', icon: Users, roles: PAGE_ACCESS.members },
    { href: '/dashboard/calendar', labelKey: 'nav.calendar', icon: Calendar, roles: ROLES },
    { href: '/dashboard/attendance', labelKey: 'nav.attendance', icon: Users, roles: PAGE_ACCESS.attendance },
    { href: '/dashboard/financial', labelKey: 'nav.financial', icon: Wallet, roles: PAGE_ACCESS.financial },
    { href: '/dashboard/communications', labelKey: 'nav.communications', icon: FileText, roles: PAGE_ACCESS.communications },
    { href: '/dashboard/documents', labelKey: 'nav.documents', icon: FileText, roles: PAGE_ACCESS.documents },
    { href: '/dashboard/reports', labelKey: 'nav.reports', icon: FileText, roles: PAGE_ACCESS.reports },
    { href: '/dashboard/audit-log', labelKey: 'nav.auditLog', icon: FileText, roles: PAGE_ACCESS.auditLog },
    { href: '/dashboard/settings', labelKey: 'nav.settings', icon: Settings, roles: ROLES },
    { href: '/dashboard/ministry', labelKey: 'nav.ministries', icon: Building2, roles: PAGE_ACCESS.ministry },
  ]
  const navItems = allNavItems.filter((item) => item.roles.includes(role))

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

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
