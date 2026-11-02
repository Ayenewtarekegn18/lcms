import Link from 'next/link'
import { Building2, CalendarDays, ChevronRight, ClipboardCheck, UserPlus, Users, Wallet } from 'lucide-react'
import { Page, PageHeader, StatCard } from '@/components/app'
import { getSession } from '@/lib/auth/guards'
import { PAGE_ACCESS, type Role } from '@/lib/auth/roles'
import { CHURCH_TIME_ZONE } from '@/lib/financial/summary'

// Shortcuts on the home page; each role sees only the pages it may open (PAGE_ACCESS).
const QUICK_ACTIONS: { href: string; label: string; icon: typeof UserPlus; roles: readonly Role[] | null }[] = [
  { href: '/dashboard/members/register', label: 'Register a member', icon: UserPlus, roles: PAGE_ACCESS.registerMember },
  { href: '/dashboard/ministry', label: 'Ministries', icon: Building2, roles: PAGE_ACCESS.ministry },
  { href: '/dashboard/attendance', label: 'Take attendance', icon: ClipboardCheck, roles: PAGE_ACCESS.attendance },
  { href: '/dashboard/financial', label: 'Financial', icon: Wallet, roles: PAGE_ACCESS.financial },
  { href: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays, roles: null },
]

const allowed = (roles: readonly Role[] | null, role: Role | null) => roles === null || (role !== null && roles.includes(role))

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat('en', { hour: 'numeric', hourCycle: 'h23', timeZone: CHURCH_TIME_ZONE }).format(now))
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export default async function DashboardPage() {
  const { supabase, user, role } = await getSession()

  // Counts only (head: true): no rows leave the database, so the home page stays fast.
  // Rendered on the server with the user's session, so RLS decides what each count includes.
  const today = new Date().toISOString().slice(0, 10)
  const [members, ministries, events] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('ministries').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('start_date', today),
  ])
  // A failed count shows a dash rather than a misleading 0.
  const count = (r: { count: number | null; error: unknown }) => (r.error ? '–' : (r.count ?? 0))

  const stats = [
    { label: 'Members', value: count(members), hint: 'Active church members', icon: Users, href: '/dashboard/members', roles: PAGE_ACCESS.members },
    { label: 'Ministries', value: count(ministries), hint: 'Active ministries', icon: Building2, href: '/dashboard/ministry', roles: PAGE_ACCESS.ministry },
    { label: 'Upcoming events', value: count(events), hint: 'From today on', icon: CalendarDays, href: '/dashboard/calendar', roles: null },
  ]
  const actions = QUICK_ACTIONS.filter((a) => allowed(a.roles, role))
  const name = (user?.user_metadata?.first_name as string | undefined) || user?.email

  return (
    <Page>
      <PageHeader title={`${greeting(new Date())}${name ? `, ${name}` : ''}`} subtitle="Here is what's happening at the church." />

      <section aria-label="Key figures" className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ href, roles, ...stat }) =>
          allowed(roles, role) ? (
            <Link key={href} href={href} className="rounded-2xl outline-none transition-shadow hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring">
              <StatCard {...stat} />
            </Link>
          ) : (
            <StatCard key={href} {...stat} />
          ),
        )}
      </section>

      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="mb-3 text-lg font-semibold text-foreground">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {actions.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground shadow-soft outline-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </Page>
  )
}
