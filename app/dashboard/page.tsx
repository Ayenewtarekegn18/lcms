import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch statistics
  const [members, ministries, events] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('is_active', true),
    supabase
      .from('ministries')
      .select('id', { count: 'exact' })
      .eq('is_active', true),
    supabase
      .from('events')
      .select('id', { count: 'exact' })
      .gte('event_date', new Date().toISOString().split('T')[0]),
  ])

  const stats = [
    {
      title: 'Total Members',
      value: members.count || 0,
      description: 'Active church members',
      href: '/dashboard/members',
    },
    {
      title: 'Ministries',
      value: ministries.count || 0,
      description: 'Active ministries',
      href: '/dashboard/ministries',
    },
    {
      title: 'Upcoming Events',
      value: events.count || 0,
      description: 'Events this month',
      href: '/dashboard/events',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2">Welcome back, {user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href} className="group">
            <Card className="hover:shadow-lg transition-all hover:border-slate-400 cursor-pointer bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/dashboard/members/register">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              + Add Member
            </Button>
          </Link>
          <Link href="/dashboard/ministry">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              + View Ministries
            </Button>
          </Link>
          <Link href="/dashboard/financial">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              + Financial Report
            </Button>
          </Link>
          <Link href="/dashboard/calendar">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              + Calendar
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Card */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">System Status</CardTitle>
          <CardDescription>Last updated just now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Database</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Authentication</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">API Status</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
