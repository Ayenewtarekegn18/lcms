import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// Page layout building blocks (docs/MINISTRY_WORKSPACES.md). Colours come from the theme tokens
// (bg-card, text-foreground, text-muted-foreground, border-border, bg-muted) so a theme can restyle them.

/** The page's content column: phone-friendly padding, a readable maximum width. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8', className)}>{children}</div>
}

type PageHeaderProps = {
  title: ReactNode
  /** A second line under the title (e.g. the Amharic name). */
  subtitle?: ReactNode
  /** A link above the title back to the parent page. */
  back?: { href: string; label: string }
  /** An icon or picture before the title. */
  icon?: ReactNode
  /** Small facts under the title (meeting time, place…); each item gets its own chip. */
  meta?: ReactNode[]
  /** Buttons on the right (below the title on phones). */
  actions?: ReactNode
}

/** The page title block: optional back link, icon, title, subtitle, facts and actions. */
export function PageHeader({ title, subtitle, back, icon, meta, actions }: PageHeaderProps) {
  const facts = (meta ?? []).filter(Boolean)
  return (
    <header className="space-y-3">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {icon && <div className="hidden shrink-0 sm:block">{icon}</div>}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>}
            {facts.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Details">
                {facts.map((fact, i) => (
                  <li key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground [&_svg]:size-3.5">
                    {fact}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}
