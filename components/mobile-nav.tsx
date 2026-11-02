'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent } from '@/components/sidebar'
import type { Role } from '@/lib/auth/roles'
import { CHURCH_NAME_EN, LOGO_MARK } from '@/lib/brand'

interface MobileNavProps {
  user: User
  role: Role
}

/**
 * Phone top bar (below md): the app name and a menu button that opens the sidebar's navigation
 * in a left-hand drawer. Rendered first inside the scrolling <main>, so it sticks to the top.
 */
export function MobileNav({ user, role }: MobileNavProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close on navigation (also back/forward): adjust state during render instead of in an effect.
  const [shownPath, setShownPath] = useState(pathname)
  if (pathname !== shownPath) {
    setShownPath(pathname)
    setOpen(false)
  }

  // The drawer belongs to the phone layout: close it when the screen grows to the desktop layout.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false)
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/85 px-2 text-foreground backdrop-blur md:hidden">
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label={t('Sidebar.openMenu')}
            className="inline-flex size-11 items-center justify-center rounded-xl outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
        </SheetTrigger>
        <Image src={LOGO_MARK.blue} alt="" width={LOGO_MARK.width} height={LOGO_MARK.height} className="h-6 w-auto" />
        <span className="truncate text-[15px] font-bold">{CHURCH_NAME_EN}</span>
      </div>
      <SheetContent
        side="left"
        closeLabel={t('Sidebar.closeMenu')}
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => {
          // Radix skips links when choosing what to focus, which lands on the language select.
          // Start on the current page's link (or the first one) instead.
          const content = e.currentTarget as HTMLElement
          const link = content.querySelector<HTMLElement>('nav a[aria-current="page"]') ?? content.querySelector<HTMLElement>('nav a')
          if (link) {
            e.preventDefault()
            link.focus()
          }
        }}
        className="w-[min(85vw,20rem)] border-r-0 bg-sidebar p-0 sm:max-w-none"
      >
        <SheetTitle className="sr-only">{t('Sidebar.menu')}</SheetTitle>
        <SidebarContent user={user} role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
