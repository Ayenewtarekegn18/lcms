'use client'

import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/language-selector'
import { LayoutDashboard, Users, Building2, Wallet, Calendar, FileText, Settings, LogOut } from 'lucide-react'
import { PAGE_ACCESS, ROLES, type Role } from '@/lib/auth/roles'
import { CHURCH_NAME_AM, CHURCH_NAME_EN, CHURCH_NAME_SHORT, LOGO_MARK } from '@/lib/brand'

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
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent">
          <Image src={LOGO_MARK.blue} alt="" width={LOGO_MARK.width} height={LOGO_MARK.height} priority className="h-auto w-9" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold leading-tight text-foreground" title={`${CHURCH_NAME_EN} · ${CHURCH_NAME_AM}`}>{CHURCH_NAME_SHORT}</p>
          <p className="truncate text-xs text-muted-foreground">{t('Sidebar.appTagline')}</p>
        </div>
      </div>

      <nav aria-label={t('Sidebar.navLabel')} className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
                active
                  ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground'
                  : 'font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              {t(`Sidebar.${item.labelKey}`)}
            </Link>
          )
        })}
      </nav>

      <div className="m-3 space-y-3 rounded-2xl bg-muted p-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden>
            {(user.email ?? '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 text-xs">
            <p className="text-muted-foreground">{t('Sidebar.account')}</p>
            <p className="truncate font-medium text-foreground">{user.email}</p>
          </div>
        </div>
        <LanguageSelector />
        <Button
          onClick={handleLogout}
          disabled={isLoading}
          variant="outline"
          className="w-full bg-card text-sm"
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
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border md:flex">
      <SidebarContent user={user} role={role} />
    </aside>
  )
}
