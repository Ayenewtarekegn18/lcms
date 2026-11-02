import type { ReactNode } from 'react'
import Image from 'next/image'
import { CHURCH_NAME_AM, CHURCH_NAME_EN, LOGO_MARK } from '@/lib/brand'

/**
 * The signed-out pages (sign in, forgot password, new password): the church-blue masthead with the
 * logo, and the page's card below it.
 */
export function AuthShell({ subtitle, footer, children }: { subtitle: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b-[3px] border-[#0C1B3F] bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-8 pt-10 text-center">
          <Image src={LOGO_MARK.white} alt="" width={LOGO_MARK.width} height={LOGO_MARK.height} priority className="h-16 w-auto" />
          <p className="mt-4 font-display text-2xl font-bold leading-snug" lang="am">{CHURCH_NAME_AM}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C3D4F7]">{CHURCH_NAME_EN} · {subtitle}</p>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-8">
        <div className="fade-in-up w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-6 shadow-[0_1px_2px_rgba(12,27,63,.05),0_10px_26px_-14px_rgba(12,27,63,.22)] sm:p-8">
            {children}
          </div>
          {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  )
}

/** A form's error line. */
export function AuthError({ children }: { children: ReactNode }) {
  return <div role="alert" className="whitespace-pre-line rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{children}</div>
}
