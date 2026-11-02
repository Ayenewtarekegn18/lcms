import type { ReactNode } from 'react'
import Image from 'next/image'
import { CHURCH_NAME_AM, CHURCH_NAME_EN, LOGO_MARK } from '@/lib/brand'

/**
 * The signed-out pages (sign in, forgot password, new password). Large screens: a soft blue panel
 * with the logo beside the form. Phones: the logo and name above the form.
 */
export function AuthShell({ subtitle, footer, children }: { subtitle: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#EAF1FF] via-[#F3F6FF] to-[#FFFFFF] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-0 size-[28rem] rounded-full bg-[#7A5AF8]/10 blur-3xl" />
        <p className="relative text-sm font-semibold text-primary">{subtitle}</p>
        <div className="relative">
          <Image src={LOGO_MARK.blue} alt="" width={LOGO_MARK.width} height={LOGO_MARK.height} priority className="h-auto w-56" />
          <p className="mt-8 text-4xl font-bold tracking-tight text-foreground">{CHURCH_NAME_EN}</p>
          <p className="mt-2 text-xl text-muted-foreground" lang="am">{CHURCH_NAME_AM}</p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Members, ministries, events, attendance and giving, in one place for the whole church.
          </p>
        </div>
        <div className="relative text-sm text-muted-foreground">{footer}</div>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="fade-in-up w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-accent">
              <Image src={LOGO_MARK.blue} alt="" width={LOGO_MARK.width} height={LOGO_MARK.height} priority className="h-auto w-11" />
            </span>
            <p className="mt-4 text-lg font-bold text-foreground">{CHURCH_NAME_EN}</p>
            <p className="text-sm text-muted-foreground" lang="am">{CHURCH_NAME_AM}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-muted-foreground lg:hidden">{footer}</div>}
        </div>
      </main>
    </div>
  )
}

/** A form's error line. */
export function AuthError({ children }: { children: ReactNode }) {
  return <div role="alert" className="whitespace-pre-line rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-sm text-destructive">{children}</div>
}
