import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBirr, type Totals } from '@/lib/financial/summary'

const CARDS = [
  { key: 'income', title: 'Income', Icon: TrendingUp, iconClass: 'text-green-600' },
  { key: 'expense', title: 'Expenses', Icon: TrendingDown, iconClass: 'text-red-600' },
  { key: 'net', title: 'Net balance', Icon: Wallet, iconClass: 'text-slate-600' },
] as const

/** Income, expenses and net in Birr: this month large, all time underneath. Totals come from the database. */
export function TotalsCards({ thisMonth, allTime, monthName }: { thisMonth: Totals | null; allTime: Totals | null; monthName: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {CARDS.map(({ key, title, Icon, iconClass }) => {
        const value = thisMonth ? thisMonth[key] : null
        const tone = key === 'net' && value != null ? (value >= 0 ? 'bg-green-50' : 'bg-red-50') : 'bg-white'
        return (
          <Card key={key} className={`border-slate-200 ${tone}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  {title} · {monthName}
                </span>
                <Icon className={`w-4 h-4 ${iconClass}`} aria-hidden />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900" data-testid={`${key}-month`}>
                {value == null ? '—' : formatBirr(value)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                All time: <span data-testid={`${key}-all`}>{allTime ? formatBirr(allTime[key]) : '—'}</span>
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
