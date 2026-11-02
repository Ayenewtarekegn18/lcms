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
    <div className="min-h-screen bg-muted p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-2">Activity log for critical actions (admin/elder only)</p>
        </div>
        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-[200px] bg-card">
            <SelectValue placeholder="Filter by resource" />
          </SelectTrigger>
          <SelectContent>
            {/* values are table names: rows are written by database triggers */}
            <SelectItem value="all">All resources</SelectItem>
            <SelectItem value="profiles">Members</SelectItem>
            <SelectItem value="financial_transactions">Financial</SelectItem>
            <SelectItem value="events">Events</SelectItem>
            <SelectItem value="attendance_records">Attendance</SelectItem>
            <SelectItem value="ministries">Ministries</SelectItem>
            <SelectItem value="ministry_members">Ministry members</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="announcements">Announcements</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent activity</CardTitle>
          <CardDescription>{entries.length} entries</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No audit entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Action</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Resource</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{entry.user_email || 'system'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {entry.resource_type}
                        {entry.resource_id ? ` #${entry.resource_id.slice(0, 8)}` : ''}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate"
                        title={entry.details ? JSON.stringify(entry.details, null, 2) : undefined}
                      >
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
