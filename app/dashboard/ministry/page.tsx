'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'

const MINISTRY_LIST = [
    {
      id: 'spiritual-service',
      name: 'Spiritual Service',
      icon: '🙏',
      description: 'Oversees spiritual care, salvation preparation, and baptism readiness',
      members: 45,
      color: 'bg-blue-50',
      href: '/dashboard/ministry/spiritual-service',
    },
    {
      id: 'teaching',
      name: 'Teaching & Seminar',
      icon: '📚',
      description: 'Organizes doctrinal teaching, seminars, and structured learning',
      members: 32,
      color: 'bg-amber-50',
      href: '/dashboard/ministry/teaching',
    },
    {
      id: 'women',
      name: "Women's Ministry",
      icon: '👩',
      description: 'Coordinates spiritual growth, fellowship, and service',
      members: 78,
      color: 'bg-pink-50',
      href: '/dashboard/ministry/women',
    },
    {
      id: 'youth',
      name: 'Youth Ministry',
      icon: '🎯',
      description: 'Engages youth through teaching, mentorship, and programs',
      members: 127,
      color: 'bg-purple-50',
      href: '/dashboard/ministry/youth',
    },
    {
      id: 'children',
      name: 'Children Ministry',
      icon: '👧',
      description: 'Manages children classes, teachers, and lesson plans',
      members: 156,
      color: 'bg-green-50',
      href: '/dashboard/ministry/children',
    },
    {
      id: 'mission',
      name: 'Mission Ministry',
      icon: '🌍',
      description: 'Manages outreach, evangelism, and mission activities',
      members: 23,
      color: 'bg-red-50',
      href: '/dashboard/ministry/mission',
    },
    {
      id: 'marriage-family',
      name: 'Marriage & Family',
      icon: '💑',
      description: 'Supports marriages and family life through counseling',
      members: 18,
      color: 'bg-rose-50',
      href: '/dashboard/ministry/marriage-family',
    },
    {
      id: 'prayer-groups',
      name: 'Prayer Groups',
      icon: '🤝',
      description: 'Coordinates prayer meetings and spiritual requests',
      members: 67,
      color: 'bg-cyan-50',
      href: '/dashboard/ministry/prayer-groups',
    },
    {
      id: 'administration',
      name: 'Administration',
      icon: '📋',
      description: 'Handles organizational operations and documentation',
      members: 12,
      color: 'bg-slate-50',
      href: '/dashboard/ministry/administration',
    },
    {
      id: 'deacons',
      name: 'Deacons',
      icon: '🙌',
      description: 'Provides pastoral care, logistics, and member support',
      members: 15,
      color: 'bg-indigo-50',
      href: '/dashboard/ministry/deacons',
    },
    {
      id: 'charity',
      name: 'Charity Ministry',
      icon: '❤️',
      description: 'Provides aid and support to members in need',
      members: 8,
      color: 'bg-orange-50',
      href: '/dashboard/ministry/charity',
    },
    {
      id: 'stage-worship',
      name: 'Stage & Worship',
      icon: '🎶',
      description: 'Manages worship services and stage operations',
      members: 35,
      color: 'bg-yellow-50',
      href: '/dashboard/ministry/stage-worship',
    },
    {
      id: 'choir',
      name: 'Neftalem Choir',
      icon: '🎵',
      description: 'Manages choir operations, rehearsals, and performances',
      members: 42,
      color: 'bg-violet-50',
      href: '/dashboard/ministry/choir',
    },
    {
      id: 'workers-aid',
      name: 'Monthly Workers Aid',
      icon: '💰',
      description: 'Manages regular aid to church workers',
      members: 24,
      color: 'bg-emerald-50',
      href: '/dashboard/ministry/workers-aid',
    },
  ]

export default function MinistriesGridPage() {
  const [search, setSearch] = useState('')
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/ministries')
      .then(r => r.ok ? r.json() : [])
      .then((dbMinistries: { id: string; name: string }[]) => {
        const counts: Record<string, number> = {}
        const promises = MINISTRY_LIST.map(m => {
          const match = dbMinistries.find(d => d.name && (d.name.toLowerCase().includes(m.name.toLowerCase().split(' ')[0]) || m.name.toLowerCase().includes(d.name.toLowerCase().split(' ')[0])))
          if (!match) return Promise.resolve()
          return fetch(`/api/ministry-members?ministry_id=${match.id}`)
            .then(r => r.ok ? r.json() : [])
            .then((arr: unknown[]) => { counts[m.id] = arr.length })
        })
        Promise.all(promises).then(() => setMemberCounts(counts))
      })
  }, [])

  const ministries = MINISTRY_LIST.map(m => ({ ...m, members: memberCounts[m.id] ?? m.members }))

  const filteredMinistries = ministries.filter((ministry) =>
    ministry.name.toLowerCase().includes(search.toLowerCase()) ||
    ministry.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Church Ministries</h1>
        <p className="text-slate-500 mt-2">Manage all ministry operations and activities</p>
      </div>

      <div className="mb-8">
        <Input
          placeholder="Search ministries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-white text-slate-900 border-slate-300 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMinistries.map((ministry) => (
          <Link key={ministry.id} href={ministry.href}>
            <Card className={`h-full hover:shadow-lg transition-all cursor-pointer border-slate-200 ${ministry.color}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-3xl mb-2">{ministry.icon}</div>
                    <CardTitle className="text-slate-900">{ministry.name}</CardTitle>
                    <CardDescription className="mt-2">{ministry.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="text-slate-600">Active Members</p>
                    <p className="text-2xl font-bold text-slate-900">{ministry.members}</p>
                  </div>
                  <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
                    View →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredMinistries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No ministries found</p>
        </div>
      )}
    </div>
  )
}
