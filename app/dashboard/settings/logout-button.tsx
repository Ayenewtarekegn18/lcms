'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { signOut } from './actions'

export function LogoutButton() {
  const [pending, startTransition] = useTransition()

  const logout = () =>
    startTransition(async () => {
      try {
        const { error } = await signOut()
        if (error) {
          toast.error(error)
          return
        }
        // A full page load, so nothing from the old session stays in memory.
        window.location.href = '/auth/login'
      } catch {
        toast.error('Could not log out. Check your connection and try again.')
      }
    })

  return (
    <Button onClick={logout} disabled={pending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
      {pending ? 'Logging out...' : 'Logout'}
    </Button>
  )
}
