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

interface SidebarContentProps extends SidebarProps {
  /** Called when a link is chosen, so the phone drawer can close even on the current page. */
  onNavigate?: () => void
}

/** Header, navigation and account footer; shared by the desktop sidebar and the phone drawer. */
export function SidebarContent({ user, role, onNavigate }: SidebarContentProps) {
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-6 border-b border-slate-200">
        <p className="text-2xl font-bold text-slate-900">{t('Sidebar.appName')}</p>
        <p className="text-xs text-slate-500 mt-1">{t('Sidebar.appTagline')}</p>
      </div>

      <nav aria-label={t('Sidebar.navLabel')} className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
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
          <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
          {isLoading ? t('Sidebar.loggingOut') : t('Sidebar.logout')}
        </Button>
      </div>
    </div>
  )
}

/** Desktop sidebar (md and up). On phones the same content opens from the top bar (components/mobile-nav.tsx). */
export function Sidebar({ user, role }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 h-screen bg-white border-r border-slate-200 flex-col fixed left-0 top-0">
      <SidebarContent user={user} role={role} />
    </aside>
  )
}
