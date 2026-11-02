'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthError, AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PASSWORD_HINT, passwordProblem } from '@/lib/auth/password'
import { createClient } from '@/lib/supabase/client'

type Stage = 'checking' | 'ready' | 'invalid'

// Step 2 of a password reset: the emailed link signs the person in for this one purpose, then they
// choose a new password. Links come in two forms: ?code=… (sent from the forgot-password page) and
// #access_token=…&refresh_token=… (sent from the Supabase dashboard's "Send password recovery").
export default function UpdatePasswordPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('checking')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const signInFromLink = async () => {
      // The client may already have read the link while starting up.
      if ((await supabase.auth.getSession()).data.session) return true
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hash.get('access_token'), refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) return !(await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })).error
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) return !(await supabase.auth.exchangeCodeForSession(code)).error
      return false
    }
    signInFromLink().then((ok) => {
      // Take the one-time token out of the address bar (and so out of the history and screenshots).
      window.history.replaceState(null, '', window.location.pathname)
      setStage(ok ? 'ready' : 'invalid')
    }, () => setStage('invalid'))
  }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const problem = passwordProblem(password)
    if (problem) return setError(problem)
    if (password !== repeat) return setError('The two passwords are not the same.')
    setBusy(true)
    setError(null)
    const { error } = await createClient().auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setError(error.code === 'same_password' ? 'Choose a password different from your old one.' : error.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthShell subtitle={t('Auth.subtitle')}>
      {stage === 'checking' && (
        <p className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" aria-hidden /> Checking your link…
        </p>
      )}

      {stage === 'invalid' && (
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">This link has expired</h1>
          <p className="text-muted-foreground">Reset links work once, for one hour. Ask for a new one.</p>
          <Button asChild className="h-12 w-full font-semibold"><Link href="/auth/forgot-password">Send a new link</Link></Button>
        </div>
      )}

      {stage === 'ready' && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
            <p className="mt-1 text-muted-foreground">{PASSWORD_HINT}</p>
          </div>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repeat">Type it again</Label>
              <Input id="repeat" type="password" autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} disabled={busy} className="h-12" />
            </div>
            {error && <AuthError>{error}</AuthError>}
            <Button type="submit" className="h-12 w-full font-semibold" disabled={busy}>
              {busy ? 'Saving…' : 'Save and sign in'}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
