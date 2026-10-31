'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Edit, Eye, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { readApiError } from '@/lib/api/client-errors'
import type { Tables } from '@/lib/database.types'
import { DIRECTORY_PAGE_SIZE, activeMinistries, memberName, rangeLabel, type DirectoryMember } from '@/lib/members/directory'
import { DeactivateMemberDialog } from './deactivate-member-dialog'
import { MemberDetailDialog } from './member-detail-dialog'
import { MemberEditDialog } from './member-edit-dialog'

const LOAD_ERROR = 'Could not load the members.'

interface MembersDirectoryProps {
  /** Edit and deactivate (MEMBER_EDITORS); the API checks the role again. */
  canEdit: boolean
  /** Show the link to the registration form (PAGE_ACCESS.registerMember). */
  canRegister: boolean
  /** The signed-in user, who can't deactivate themselves. */
  currentUserId: string
}

/** The members page: reads GET /api/members, edits and deactivates through /api/members/[id]. */
export function MembersDirectory({ canEdit, canRegister, currentUserId }: MembersDirectoryProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState({ query: '', offset: 0 })
  const [reload, setReload] = useState(0)
  const [members, setMembers] = useState<DirectoryMember[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [viewing, setViewing] = useState<DirectoryMember | null>(null)
  const [editing, setEditing] = useState<DirectoryMember | null>(null)
  const [deactivating, setDeactivating] = useState<DirectoryMember | null>(null)

  // Search on the server once typing pauses; a new search starts again at the first page.
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = search.trim()
      setPage((p) => (p.query === query ? p : { query, offset: 0 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const ctl = new AbortController()
    const params = new URLSearchParams({ limit: String(DIRECTORY_PAGE_SIZE), offset: String(page.offset) })
    if (page.query) params.set('search', page.query)

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/members?${params}`, { signal: ctl.signal })
        if (!res.ok) {
          const { message } = await readApiError(res, LOAD_ERROR)
          if (!ctl.signal.aborted) { setFailed(true); toast.error(message) }
          return
        }
        const rows: DirectoryMember[] = await res.json()
        setMembers(rows)
        setTotal(Number(res.headers.get('X-Total-Count') ?? rows.length) || rows.length)
        setFailed(false)
      } catch {
        if (ctl.signal.aborted) return
        setFailed(true)
        toast.error(`${LOAD_ERROR} Check your connection and try again.`)
      } finally {
        if (!ctl.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => ctl.abort()
  }, [page, reload])

  const onSaved = (profile: Tables<'profiles'>) => {
    setEditing(null)
    setMembers((list) => list.map((m) => (m.id === profile.id ? { ...m, ...profile } : m)))
  }

  const onDeactivated = (id: string) => {
    setDeactivating(null)
    setMembers((list) => list.filter((m) => m.id !== id))
    setTotal((t) => Math.max(0, t - 1))
    // Refill the page from the server, or step back when its last row is gone.
    if (members.length === 1 && page.offset > 0) {
      setPage((p) => ({ ...p, offset: Math.max(0, p.offset - DIRECTORY_PAGE_SIZE) }))
    } else {
      setReload((n) => n + 1)
    }
  }

  const hasPrevious = page.offset > 0
  const hasNext = page.offset + members.length < total
  const firstLoad = loading && members.length === 0

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Input
          type="search"
          aria-label="Search members"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-white border-slate-300 text-slate-900 placeholder-slate-400"
        />
        {canRegister && (
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/dashboard/members/register">+ Add Member</Link>
          </Button>
        )}
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Members Directory</CardTitle>
          <CardDescription>
            {firstLoad ? 'Loading…' : page.query ? `${total} matching members` : `${total} active members`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {firstLoad && !failed ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Loading members...</p>
            </div>
          ) : failed && members.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-slate-500">The members could not be loaded.</p>
              <Button variant="outline" onClick={() => setReload((n) => n + 1)} disabled={loading}>
                {loading ? 'Trying again…' : 'Try again'}
              </Button>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-slate-500">
                {page.query ? `No active members match "${page.query}".` : 'No members yet.'}
              </p>
              {canRegister && !page.query && (
                <Button asChild variant="outline">
                  <Link href="/dashboard/members/register">Register the first member</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Member No.</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ministry</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const name = memberName(member)
                      return (
                        <tr
                          key={member.id}
                          data-testid={`member-row-${member.id}`}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{name}</td>
                          <td className="px-6 py-4 text-sm font-mono text-slate-600">{member.member_details?.member_number ?? '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{member.email || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{member.phone || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{activeMinistries(member).join(', ') || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setViewing(member)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="View details"
                                aria-label={`View ${name}`}
                              >
                                <Eye className="w-4 h-4" aria-hidden />
                              </button>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => setEditing(member)}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Edit member"
                                  aria-label={`Edit ${name}`}
                                >
                                  <Edit className="w-4 h-4" aria-hidden />
                                </button>
                              )}
                              {canEdit && member.id !== currentUserId && (
                                <button
                                  type="button"
                                  onClick={() => setDeactivating(member)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Deactivate member"
                                  aria-label={`Deactivate ${name}`}
                                >
                                  <UserX className="w-4 h-4" aria-hidden />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-600">
                <span>{rangeLabel(page.offset, members.length, total)}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => ({ ...p, offset: Math.max(0, p.offset - DIRECTORY_PAGE_SIZE) }))}
                    disabled={!hasPrevious || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => ({ ...p, offset: p.offset + DIRECTORY_PAGE_SIZE }))}
                    disabled={!hasNext || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {viewing && (
        <MemberDetailDialog
          member={viewing}
          canEdit={canEdit}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}
      {editing && <MemberEditDialog key={editing.id} member={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
      {deactivating && (
        <DeactivateMemberDialog
          key={deactivating.id}
          member={deactivating}
          onClose={() => setDeactivating(null)}
          onDeactivated={onDeactivated}
        />
      )}
    </>
  )
}
