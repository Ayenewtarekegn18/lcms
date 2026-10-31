'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddTransactionDialog } from '@/components/financial/add-transaction-dialog'
import { DeleteTransactionDialog } from '@/components/financial/delete-transaction-dialog'
import { TotalsCards } from '@/components/financial/totals-cards'
import { downloadCsv, toCsv } from '@/lib/csv'
import {
  formatBirr, formatLedgerDate, monthLabel, UNCATEGORIZED, type CategoryTotal, type Kind, type LedgerEntry, type LedgerPage,
} from '@/lib/financial/summary'

const PAGE_SIZE = 50
const selectClass = 'px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white'

type Filters = { type: '' | Kind; month: string }

function ledgerUrl(filters: Filters, offset: number, limit: number) {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  if (filters.type) params.set('type', filters.type)
  if (filters.month) params.set('month', filters.month)
  return `/api/financial?${params}`
}

async function readLedger(url: string): Promise<LedgerPage> {
  const res = await fetch(url, { cache: 'no-store' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(res.status === 403 ? 'You are not allowed to see the ledger.' : body?.error ?? 'Could not load the ledger.')
  }
  return body as LedgerPage
}

export default function FinancialPage() {
  const [filters, setFilters] = useState<Filters>({ type: '', month: '' })
  const [offset, setOffset] = useState(0)
  const [ledger, setLedger] = useState<LedgerPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<LedgerEntry | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setLedger(await readLedger(ledgerUrl(filters, offset, PAGE_SIZE)))
      setFailed(false)
    } catch (error) {
      setFailed(true)
      toast.error(error instanceof Error ? error.message : 'Could not load the ledger.')
    } finally {
      setLoading(false)
    }
  }, [filters, offset])

  useEffect(() => { load() }, [load])

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setOffset(0)
  }

  // Every row matching the filters, read page by page through the API.
  const exportCsv = async () => {
    setExporting(true)
    try {
      const rows: LedgerEntry[] = []
      let total = Infinity
      while (rows.length < total) {
        const page = await readLedger(ledgerUrl(filters, rows.length, 500))
        total = page.total
        if (page.transactions.length === 0) break
        rows.push(...page.transactions)
      }
      const csv = toCsv([
        ['Date', 'Type', 'Category', 'Amount (ETB)', 'Description'],
        ...rows.map((t) => [t.transaction_date, t.transaction_type, t.category, t.amount, t.description]),
      ])
      downloadCsv(`financial-transactions-${filters.month || ledger?.today || 'all'}.csv`, csv)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not export the ledger.')
    } finally {
      setExporting(false)
    }
  }

  const transactions = ledger?.transactions ?? []
  const total = ledger?.total ?? 0
  const thisMonthName = ledger ? monthLabel(ledger.month) : 'This month'
  const periodName = filters.month ? monthLabel(filters.month) : 'All time'

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Financial Management</h1>
          <p className="text-slate-500 mt-2">Track income, expenses, and church finances, in Birr</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={loading || exporting || total === 0}>
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      <TotalsCards thisMonth={ledger?.totals.thisMonth ?? null} allTime={ledger?.totals.allTime ?? null} monthName={thisMonthName} />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="filter-type" className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select id="filter-type" value={filters.type} onChange={(e) => setFilter('type', e.target.value as Filters['type'])} className={selectClass}>
            <option value="">Income and expenses</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-month" className="block text-xs font-medium text-slate-600 mb-1">Month</label>
          <select id="filter-month" value={filters.month} onChange={(e) => setFilter('month', e.target.value)} className={selectClass}>
            <option value="">All months</option>
            {(ledger?.months ?? []).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        {ledger?.permissions.create && (
          <Button onClick={() => setAdding(true)} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        )}
      </div>

      <Tabs defaultValue="transactions" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Transactions</CardTitle>
              <CardDescription>
                {loading && !ledger ? 'Loading…' : `${total} ${total === 1 ? 'transaction' : 'transactions'}`}
                {ledger?.totals.period && ` · ${periodName}: income ${formatBirr(ledger.totals.period.income)}, expenses ${formatBirr(ledger.totals.period.expense)}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !ledger ? (
                <p className="text-center py-12 text-slate-500">Loading transactions…</p>
              ) : failed && !ledger ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-slate-500">The ledger could not be loaded.</p>
                  <Button variant="outline" onClick={load}>Try again</Button>
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center py-12 text-slate-500">No transactions recorded</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full" aria-busy={loading}>
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Type</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Category</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Description</th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Amount</th>
                          {ledger?.permissions.delete && (
                            <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn) => {
                          const income = txn.transaction_type === 'income'
                          return (
                            <tr key={txn.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors" data-testid="ledger-row">
                              <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{formatLedgerDate(txn.transaction_date)}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${income ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {income ? 'Income' : 'Expense'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{txn.category || UNCATEGORIZED}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 break-words">{txn.description}</td>
                              <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                <span className={income ? 'text-green-600' : 'text-red-600'}>
                                  {income ? '+' : '−'}{formatBirr(txn.amount)}
                                </span>
                              </td>
                              {ledger?.permissions.delete && (
                                <td className="px-6 py-4 text-sm text-center">
                                  <button
                                    type="button"
                                    onClick={() => setDeleting(txn)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    aria-label={`Delete ${income ? 'income' : 'expense'} of ${formatBirr(txn.amount)}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {total > PAGE_SIZE && (
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                      <span>{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={loading || offset === 0} onClick={() => setOffset((o) => Math.max(o - PAGE_SIZE, 0))}>
                          Newer
                        </Button>
                        <Button variant="outline" size="sm" disabled={loading || offset + PAGE_SIZE >= total} onClick={() => setOffset((o) => o + PAGE_SIZE)}>
                          Older
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryCard title="Income by Category" period={periodName} kind="income" categories={ledger?.categories ?? null} />
            <CategoryCard title="Expenses by Category" period={periodName} kind="expense" categories={ledger?.categories ?? null} />
          </div>
        </TabsContent>
      </Tabs>

      {ledger && adding && (
        <AddTransactionDialog open={adding} onOpenChange={setAdding} today={ledger.today} onSaved={load} />
      )}
      <DeleteTransactionDialog entry={deleting} onClose={() => setDeleting(null)} onDeleted={load} />
    </div>
  )
}

function CategoryCard({ title, period, kind, categories }: {
  title: string
  period: string
  kind: Kind
  categories: CategoryTotal[] | null
}) {
  const rows = (categories ?? []).filter((c) => c.kind === kind)
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">{title}</CardTitle>
        <CardDescription>{period}</CardDescription>
      </CardHeader>
      <CardContent>
        {categories === null ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-slate-500 text-sm">{kind === 'income' ? 'No income recorded' : 'No expenses recorded'}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((c) => (
              <div key={c.category} className="flex items-center justify-between gap-4">
                <span className="text-slate-700">{c.category} <span className="text-xs text-slate-400">({c.count})</span></span>
                <span className={`font-medium ${kind === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatBirr(c.total)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
