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
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

export function SelectMemberModal({
  open,
  onOpenChange,
  onSelect,
  title = 'Add member',
  description = 'Search and select a church member to add to this ministry.',
}: SelectMemberModalProps) {
  const [search, setSearch] = useState('')
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    setSearch('')
    loadMembers()
  }, [open])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .eq('is_active', true)
        .order('first_name', { ascending: true })

      if (error) throw error
      setMembers((data as Profile[]) || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load members')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = members.filter(
    (m) =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSelect = (member: Profile) => {
    onSelect(member)
    onOpenChange(false)
    toast.success(`Added ${member.first_name} ${member.last_name}`)
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto border border-slate-200 rounded-lg">
            {loading ? (
              <div className="p-6 text-center text-slate-500 text-sm">Loading members...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No members found</div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {filtered.map((member) => (
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
