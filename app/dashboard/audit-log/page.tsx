'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AuditEntry {
  id: string
  user_id: string
  user_email: string
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [resourceFilter, setResourceFilter] = useState<string>('all')

  useEffect(() => {
    fetchLog()
  }, [resourceFilter])

  const fetchLog = async () => {
    setLoading(true)
    try {
      const url = resourceFilter === 'all' ? '/api/audit-log?limit=100' : `/api/audit-log?limit=100&resource_type=${encodeURIComponent(resourceFilter)}`
      const res = await fetch(url)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const errMsg =
          typeof data?.error === 'string'
            ? data.error
            : res.status === 403
              ? 'You need admin access to view the audit log.'
              : res.status === 401
                ? 'Sign in to view the audit log.'
                : 'Failed to load audit log.'
        toast.error(errMsg)
        setEntries([])
        return
      }
      setEntries(Array.isArray(data) ? data : [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error'
      toast.error(msg)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-500 mt-2">Activity log for critical actions (admin/elder only)</p>
        </div>
        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="Filter by resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resources</SelectItem>
            <SelectItem value="member">Members</SelectItem>
            <SelectItem value="financial_transaction">Financial</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="attendance">Attendance</SelectItem>
            <SelectItem value="ministry">Ministries</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Recent activity</CardTitle>
          <CardDescription>{entries.length} entries</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 py-8 text-center">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-slate-500 py-8 text-center">No audit entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Action</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Resource</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">{entry.user_email || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {entry.resource_type}
                        {entry.resource_id ? ` #${entry.resource_id.slice(0, 8)}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {entry.details && Object.keys(entry.details).length > 0
                          ? JSON.stringify(entry.details)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
