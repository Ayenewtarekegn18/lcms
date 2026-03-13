'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Users, DollarSign, Calendar, Download, BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const [

        { count: membersCount },
        { count: activeCount },
        { count: newMembersCount },
        { count: ministriesCount },
        { count: eventsCount },
        { data: transactions },
        { count: attendanceCount },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        supabase.from('ministries').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('financial_transactions').select('type, amount'),
        supabase.from('attendance').select('id', { count: 'exact', head: true }),
      ])

      const income = (transactions || []).filter((t: { type: string }) => t.type === 'income').reduce((s: number, t: { amount: number }) => s + (t.amount || 0), 0)
      const expense = (transactions || []).filter((t: { type: string }) => t.type === 'expense').reduce((s: number, t: { amount: number }) => s + (t.amount || 0), 0)
      const balance = income - expense

      setReportData({
        members: membersCount ?? 0,
        activeMembers: activeCount ?? 0,
        newMembers: newMembersCount ?? 0,
        attendance: {
          avg: Math.round((attendanceCount ?? 0) / 4) || 0,
          total: attendanceCount ?? 0,
          trend: '—',
          lastWeek: attendanceCount ?? 0,
        },
        financial: {
          totalIncome: income,
          totalExpense: expense,
          balance,
          trend: balance >= 0 ? 'Surplus' : 'Deficit',
        },
        ministries: ministriesCount ?? 0,
        events: eventsCount ?? 0,
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!reportData) return
    const rows = [
      ['Report', 'Value'],
      ['Total Members', reportData.members],
      ['Active Members', reportData.activeMembers],
      ['New Members This Month', reportData.newMembers],
      ['Ministries', reportData.ministries],
      ['Events', reportData.events],
      ['Total Income', reportData.financial.totalIncome],
      ['Total Expenses', reportData.financial.totalExpense],
      ['Net Balance', reportData.financial.balance],
      ['Attendance Records', reportData.attendance.total],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `church-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <p className="text-slate-500">Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-2">Comprehensive church statistics and insights</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleExportCSV} disabled={!reportData}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Total Members
              <Users className="w-4 h-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{reportData?.members}</div>
            <p className="text-xs text-green-600 mt-1">+{reportData?.newMembers ?? 0} this month</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Avg Attendance
              <Calendar className="w-4 h-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{reportData?.attendance?.avg ?? reportData?.attendance?.total ?? 0}</div>
            <p className="text-xs text-slate-600 mt-1">{reportData?.attendance?.trend ?? '—'}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Total Income
              <DollarSign className="w-4 h-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              ${(reportData?.financial.totalIncome ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-600 mt-1">YTD</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
              Net Balance
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${(reportData?.financial.balance ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">{reportData?.financial.trend}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Monthly Overview</CardTitle>
                <CardDescription>Church activity snapshot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Active Members</span>
                    <span className="font-bold text-slate-900">{reportData?.activeMembers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Total Ministries</span>
                    <span className="font-bold text-slate-900">{reportData?.ministries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Events Hosted</span>
                    <span className="font-bold text-slate-900">{reportData?.events}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Avg Service Attendance</span>
                    <span className="font-bold text-slate-900">{reportData?.attendance.avg}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Growth Trends</CardTitle>
                <CardDescription>Year-to-date performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-700">Membership Growth</span>
                      <span className="text-sm font-bold text-slate-900">+8%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-700">Attendance Rate</span>
                      <span className="text-sm font-bold text-slate-900">78%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-700">Financial Health</span>
                      <span className="text-sm font-bold text-slate-900">85%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-700">Engagement</span>
                      <span className="text-sm font-bold text-slate-900">72%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '72%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Attendance Analytics</CardTitle>
              <CardDescription>Service attendance trends and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Average Service</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{reportData?.attendance.avg}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Last Week</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{reportData?.attendance?.total ?? 0}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900 mb-3">Weekly Attendance</p>
                  <div className="space-y-2">
                    {['Sunday', 'Wednesday', 'Friday', 'Youth', 'Children'].map((service, idx) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">{service}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-slate-900 h-2 rounded-full"
                              style={{ width: `${80 - idx * 10}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-900 w-12">{280 - idx * 30}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Income vs Expenses</CardTitle>
                <CardDescription>Financial comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">Total Income</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      ${(reportData?.financial?.totalIncome ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-900 mt-1">
                      ${(reportData?.financial?.totalExpense ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">Net Balance</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      ${(reportData?.financial?.balance ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Ministry Operations', amount: 12500, percent: 39 },
                    { name: 'Building & Maintenance', amount: 8200, percent: 26 },
                    { name: 'Staff Compensation', amount: 7500, percent: 23 },
                    { name: 'Outreach Programs', amount: 3900, percent: 12 },
                  ].map((category) => (
                    <div key={category.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-700">{category.name}</span>
                        <span className="text-sm font-semibold text-slate-900">
                          ${category.amount.toLocaleString()} ({category.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-slate-900 h-2 rounded-full"
                          style={{ width: `${category.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="membership">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Membership Demographics</CardTitle>
              <CardDescription>Member statistics and growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Members', value: reportData?.members ?? 0, color: 'bg-blue-100 text-blue-900' },
                  { label: 'Active Members', value: reportData?.activeMembers ?? 0, color: 'bg-green-100 text-green-900' },
                  { label: 'New This Month', value: reportData?.newMembers ?? 0, color: 'bg-emerald-100 text-emerald-900' },
                  { label: 'Inactive', value: (reportData?.members ?? 0) - (reportData?.activeMembers ?? 0), color: 'bg-slate-100 text-slate-900' },
                ].map((stat) => (
                  <div key={stat.label} className={`p-4 rounded-lg ${stat.color}`}>
                    <p className="text-sm font-medium opacity-75">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-sm font-medium text-slate-900">Age Distribution</p>
                {[
                  { range: '18-25', count: 67, percent: 14 },
                  { range: '26-35', count: 89, percent: 18 },
                  { range: '36-50', count: 142, percent: 29 },
                  { range: '51-65', count: 98, percent: 20 },
                  { range: '65+', count: 91, percent: 19 },
                ].map((age) => (
                  <div key={age.range} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{age.range}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-slate-900 h-2 rounded-full"
                          style={{ width: `${age.percent}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12">{age.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
