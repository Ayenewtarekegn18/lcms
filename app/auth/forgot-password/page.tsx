'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthError, AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

// Step 1 of a password reset: Supabase emails a link to /auth/update-password. The page says the same
// thing whether or not the address has an account, so it can't be used to find out who does.
export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const send = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    setBusy(false)
    if (error && error.status === 429) setError('Too many reset emails were asked for. Wait a few minutes and try again.')
    else if (error && error.status !== 400) setError('Could not send the email. Check your connection and try again.')
    else setSent(true)
  }

  return (
    <AuthShell subtitle={t('Auth.subtitle')} footer={<Link href="/auth/login" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"><ArrowLeft className="size-4" aria-hidden /> Back to sign in</Link>}>
      {sent ? (
        <div className="space-y-3 text-center">
          <MailCheck className="mx-auto size-10 text-primary" aria-hidden />
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground">
            If <span className="font-medium text-foreground">{email.trim()}</span> has an account, a link to choose a new password is on its way. It works once, for one hour.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
            <p className="mt-1 text-muted-foreground">Enter your email and we&apos;ll send you a link to choose a new one.</p>
          </div>
          <form onSubmit={send} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('Auth.emailLabel')}</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} className="h-12" />
            </div>
            {error && <AuthError>{error}</AuthError>}
            <Button type="submit" className="h-12 w-full font-semibold" disabled={busy}>
              {busy ? 'Sending…' : 'Send the reset link'}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
