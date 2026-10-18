'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Download } from 'lucide-react'

const INCOME_CATEGORIES = [
  'Tithes',
  'Offerings',
  'Pledges',
  'Donations',
  'Special Offering',
  'Other Income',
] as const

const EXPENSE_CATEGORIES = [
  'Ministry Spending',
  'Maintenance',
  'Outreach',
  'Staff Compensation',
  'Administrative',
  'Utilities',
  'Supplies',
  'Programs',
  'Other Expense',
] as const

interface Transaction {
  id: string
  transaction_date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  member_id?: string
}

export default function FinancialPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ income: 0, expense: 0 })
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: 0,
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  })
  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(50)

      if (error) throw error

      const txns = data || []
      setTransactions(txns)

      const income = txns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      const expense = txns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      setTotals({ income, expense })
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .insert([{
          ...formData,
          amount: parseFloat(formData.amount.toString()),
        }])
      if (error) throw error
      fetchTransactions()
      setModalOpen(false)
      setFormData({
        type: 'income',
        category: '',
        amount: 0,
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
      })
    } catch (error) {
      console.error('Error adding transaction:', error)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)
      if (error) throw error
      fetchTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const net = totals.income - totals.expense

  // Real category breakdown from transactions
  const incomeByCategory = transactions
    .filter((t) => t.type === 'income')
    .reduce<Record<string, number>>((acc, t) => {
      const cat = t.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + (t.amount || 0)
      return acc
    }, {})
  const expenseByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      const cat = t.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + (t.amount || 0)
      return acc
    }, {})

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description']
    const rows = transactions.map((t) => [
      t.transaction_date,
      t.type,
      t.category || '',
      t.amount,
      (t.description || '').replace(/"/g, '""'),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => (typeof c === 'string' ? `"${c}"` : c)).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `financial-transactions-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Financial Management</h1>
          <p className="text-slate-500 mt-2">Track income, expenses, and church finances</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={loading || transactions.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Total Income</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${totals.income.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">All donations and offerings</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Total Expenses</span>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${totals.expense.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Operations and programs</p>
          </CardContent>
        </Card>

        <Card className={`border-slate-200 ${net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Net Balance</span>
              <DollarSign className={`w-4 h-4 ${net >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${net >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              ${net.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Income minus expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="transactions" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="departments">By Department</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <div className="mb-6">
            <Button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Recent Transactions</CardTitle>
              <CardDescription>{transactions.length} total transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No transactions recorded</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Category</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Description</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Amount</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(txn.transaction_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              txn.type === 'income'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {txn.type === 'income' ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{txn.category}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{txn.description}</td>
                          <td className="px-6 py-4 text-sm font-medium text-right">
                            <span className={txn.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                              {txn.type === 'income' ? '+' : '-'}${txn.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <button
                              onClick={() => handleDeleteTransaction(txn.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Income by Category</CardTitle>
                <CardDescription>Contributions organized by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(incomeByCategory).length === 0 ? (
                    <p className="text-slate-500 text-sm">No income recorded yet</p>
                  ) : (
                    Object.entries(incomeByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-slate-700">{category}</span>
                          <span className="font-medium text-green-600">+${amount.toFixed(2)}</span>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Expenses by Category</CardTitle>
                <CardDescription>Expenses organized by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(expenseByCategory).length === 0 ? (
                    <p className="text-slate-500 text-sm">No expenses recorded yet</p>
                  ) : (
                    Object.entries(expenseByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-slate-700">{category}</span>
                          <span className="font-medium text-red-600">-${amount.toFixed(2)}</span>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Summary by Category</CardTitle>
              <CardDescription>All categories with totals (department/ministry tracking can be added later)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(expenseByCategory).length === 0 && Object.entries(incomeByCategory).length === 0 ? (
                  <p className="text-slate-500 text-sm">No transactions to summarize</p>
                ) : (
                  <>
                    {Object.entries(incomeByCategory).map(([cat, amt]) => (
                      <div key={`i-${cat}`} className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-700">{cat}</span>
                        <span className="text-green-600 font-medium">+${amt.toFixed(2)}</span>
                      </div>
                    ))}
                    {Object.entries(expenseByCategory).map(([cat, amt]) => (
                      <div key={`e-${cat}`} className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-700">{cat}</span>
                        <span className="text-red-600 font-medium">-${amt.toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Transaction Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Record a new financial transaction</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="type" className="text-slate-700">
                Type
              </Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'income' | 'expense'
                  setFormData({ ...formData, type: newType, category: '' })
                }}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <Label htmlFor="category" className="text-slate-700">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === 'income'
                    ? INCOME_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))
                    : EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount" className="text-slate-700">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="date" className="text-slate-700">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add notes about this transaction..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTransaction} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
