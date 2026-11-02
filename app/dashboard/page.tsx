import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Building2, CalendarDays, ChevronRight, ClipboardCheck, UserPlus, Wallet } from 'lucide-react'
import { getSession } from '@/lib/auth/guards'
import { PAGE_ACCESS, type Role } from '@/lib/auth/roles'

// Shortcuts on the home page; each role sees only the pages it may open (PAGE_ACCESS).
const QUICK_ACTIONS: { href: string; label: string; icon: typeof UserPlus; roles: readonly Role[] | null }[] = [
  { href: '/dashboard/members/register', label: 'Register a member', icon: UserPlus, roles: PAGE_ACCESS.registerMember },
  { href: '/dashboard/ministry', label: 'Ministries', icon: Building2, roles: PAGE_ACCESS.ministry },
  { href: '/dashboard/attendance', label: 'Take attendance', icon: ClipboardCheck, roles: PAGE_ACCESS.attendance },
  { href: '/dashboard/financial', label: 'Financial', icon: Wallet, roles: PAGE_ACCESS.financial },
  { href: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays, roles: null },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { role } = await getSession()
  const actions = QUICK_ACTIONS.filter((a) => a.roles === null || (role !== null && a.roles.includes(role)))

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Counts only (head: true): no rows leave the database, so the home page stays fast.
  // Rendered on the server with the user's session, so RLS decides what each count includes.
  const today = new Date().toISOString().slice(0, 10)
  const [members, ministries, events] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('ministries').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('start_date', today),
  ])
  // A failed count shows a dash rather than a misleading 0.
  const count = (r: { count: number | null; error: unknown }) => (r.error ? '–' : (r.count ?? 0))

  const stats = [
    {
      title: 'Total Members',
      value: count(members),
      description: 'Active church members',
      href: '/dashboard/members',
    },
    {
      title: 'Ministries',
      value: count(ministries),
      description: 'Active ministries',
      href: '/dashboard/ministries',
    },
    {
      title: 'Upcoming Events',
      value: count(events),
      description: 'Events from today on',
      href: '/dashboard/events',
    },
  ]

  return (
    <div className="min-h-screen bg-muted p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back, {user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href} className="group">
            <Card className="hover:shadow-lg transition-all hover:border-input cursor-pointer bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {actions.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm font-semibold text-foreground shadow-sm outline-none transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </div>
      </div>

      {/* Status Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">System Status</CardTitle>
          <CardDescription>Last updated just now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Database</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Authentication</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API Status</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
