'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { readApiError } from '@/lib/api/client-errors'
import type { DirectoryMember } from '@/lib/members/directory'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface SelectMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (member: Profile) => void
  title?: string
  description?: string
}

const LIMIT = 50
const LOAD_ERROR = 'Could not load the members.'

const toProfile = (m: DirectoryMember): Profile => ({
  id: m.id,
  first_name: m.first_name,
  last_name: m.last_name,
  email: m.email ?? undefined,
  phone: m.phone ?? undefined,
})

// Picks an active member from the directory (GET /api/members, searched on the server).
// The caller saves the choice and reports the result.
export function SelectMemberModal({
  open,
  onOpenChange,
  onSelect,
  title = 'Add member',
  description = 'Search and select a church member to add to this ministry.',
}: SelectMemberModalProps) {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [members, setMembers] = useState<Profile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setSearch('')
  }, [open])

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!open) return
    const ctl = new AbortController()
    const params = new URLSearchParams({ order: 'name', limit: String(LIMIT) })
    if (query) params.set('search', query)

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/members?${params}`, { signal: ctl.signal })
        if (!res.ok) {
          const { message } = await readApiError(res, LOAD_ERROR)
          if (!ctl.signal.aborted) { toast.error(message); setMembers([]); setTotal(0) }
          return
        }
        const rows: DirectoryMember[] = await res.json()
        setMembers(rows.map(toProfile))
        setTotal(Number(res.headers.get('X-Total-Count') ?? rows.length) || rows.length)
      } catch {
        if (ctl.signal.aborted) return
        toast.error(`${LOAD_ERROR} Check your connection and try again.`)
        setMembers([])
        setTotal(0)
      } finally {
        if (!ctl.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => ctl.abort()
  }, [open, query])

  const handleSelect = (member: Profile) => {
    onSelect(member)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-slate-600">{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
            <Input
              type="search"
              aria-label="Search members"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto border border-slate-200 rounded-lg" aria-busy={loading}>
            {loading && members.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                {query ? `No active members match "${query}".` : 'No members found'}
              </div>
            ) : (
              <ul className={`divide-y divide-slate-200 ${loading ? 'opacity-60' : ''}`}>
                {members.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(member)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium text-slate-900">
                        {member.first_name} {member.last_name}
                      </span>
                      {(member.email || member.phone) && (
                        <span className="text-xs text-slate-500 truncate max-w-[140px]">
                          {member.email || member.phone}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {total > members.length && (
            <p className="text-xs text-slate-500">
              Showing {members.length} of {total}. Type a name to narrow the list.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300 text-slate-700">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
