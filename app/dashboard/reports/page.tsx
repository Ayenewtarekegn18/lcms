'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Calendar, ClipboardList, Download, Network, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { downloadCsv, toCsv } from '@/lib/csv'
import { formatBirr, monthLabel, type CategoryTotal, type Totals } from '@/lib/financial/summary'
import { reportCsvRows, type ReportFigures } from '@/lib/reports/figures'

const count = new Intl.NumberFormat('en')

// Every figure on this page comes from GET /api/reports (computed in the database). Nothing is estimated.
export default function ReportsPage() {
  const [report, setReport] = useState<ReportFigures | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports', { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(res.status === 403 ? 'You are not allowed to see the reports.' : body?.error ?? 'Could not load the reports.')
        return
      }
      setReport(body as ReportFigures)
    } catch {
      toast.error('Could not reach the server. Check the connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const exportCsv = () => {
    if (report) downloadCsv(`church-report-${report.month}.csv`, toCsv(reportCsvRows(report)))
  }

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <p className="text-slate-500">Loading reports…</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 space-y-3">
        <p className="text-slate-500">The reports could not be loaded.</p>
        <Button variant="outline" onClick={load}>Try again</Button>
      </div>
    )
  }

  const { counts, finance } = report
  const monthName = monthLabel(report.month)
  const tiles = [
    { key: 'members-active', label: 'Active members', value: counts.members_active, note: `of ${count.format(counts.members_total)} people on record`, Icon: Users },
    { key: 'ministries', label: 'Active ministries', value: counts.ministries_active, note: null, Icon: Network },
    { key: 'events-upcoming', label: 'Upcoming events', value: counts.events_upcoming, note: null, Icon: Calendar },
    { key: 'attendance', label: 'Attendance records', value: counts.attendance_total, note: 'all time', Icon: ClipboardList },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-2">Church figures from the records, as of today</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={exportCsv}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {tiles.map(({ key, label, value, note, Icon }) => (
          <Card key={key} className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center justify-between">
                {label}
                <Icon className="w-4 h-4 text-slate-400" aria-hidden />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900" data-testid={`report-${key}`}>{count.format(value)}</div>
              {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {finance ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MoneyCard title={monthName} description="Income and expenses this month" totals={finance.thisMonth} testId="report-month" />
          <MoneyCard title="All time" description="Everything on the ledger" totals={finance.allTime} testId="report-all" />
          <CategoriesCard monthName={monthName} categories={finance.categories} />
        </div>
      ) : (
        <Card className="bg-white border-slate-200">
          <CardContent className="py-6 text-sm text-slate-500">
            Financial figures are shown to admins, elders and the finance team.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MoneyCard({ title, description, totals, testId }: { title: string; description: string; totals: Totals; testId: string }) {
  const lines = [
    { key: 'income', label: 'Income', value: totals.income, tone: 'text-green-700' },
    { key: 'expense', label: 'Expenses', value: totals.expense, tone: 'text-red-700' },
    { key: 'net', label: 'Net', value: totals.net, tone: totals.net >= 0 ? 'text-slate-900' : 'text-red-700' },
  ]
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">{title}</CardTitle>
        <CardDescription>{description} · {count.format(totals.count)} transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {lines.map((line) => (
            <div key={line.key} className="flex items-center justify-between">
              <dt className="text-slate-700">{line.label}</dt>
              <dd className={`font-bold ${line.tone}`} data-testid={`${testId}-${line.key}`}>{formatBirr(line.value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function CategoriesCard({ monthName, categories }: { monthName: string; categories: CategoryTotal[] }) {
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">By category</CardTitle>
        <CardDescription>{monthName}</CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing recorded this month</p>
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={`${c.kind}:${c.category}`} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-700">{c.category}</span>
                <span className={`font-medium ${c.kind === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                  {c.kind === 'income' ? '+' : '−'}{formatBirr(c.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
