'use client'

import React from "react"
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Calendar, FileText, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MinistryDashboardProps {
  name: string
  description: string
  icon: React.ReactNode
  memberCount: number
  lastActivity: string
  metrics: Array<{
    label: string
    value: number | string
    icon: React.ReactNode
  }>
  tabs?: Array<{
    id: string
    label: string
  }>
  children?: React.ReactNode
  /** Link for the Add button (e.g. /dashboard/members/register). Ignored if onAddMemberClick is set. */
  addMemberHref?: string
  /** Label for the primary Add action button */
  addButtonLabel?: string
  /** When set, Add button calls this instead of linking (e.g. open select-member modal). */
  onAddMemberClick?: () => void
}

export function MinistryDashboard({
  name,
  description,
  icon,
  memberCount,
  lastActivity,
  metrics,
  tabs,
  children,
  addMemberHref = '/dashboard/members/register',
  addButtonLabel = '+ Add Member',
  onAddMemberClick,
}: MinistryDashboardProps) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">{icon}</div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">{name}</h1>
            <p className="text-slate-500 mt-2">{description}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                {metric.label}
              </CardTitle>
              <div className="text-slate-500">{metric.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-3">
        {onAddMemberClick ? (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onAddMemberClick}>
            {addButtonLabel}
          </Button>
        ) : addMemberHref ? (
          <Link href={addMemberHref}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {addButtonLabel}
            </Button>
          </Link>
        ) : (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {addButtonLabel}
          </Button>
        )}
        <Button
          variant="outline"
          className="border-slate-300 bg-transparent text-slate-700"
          onClick={() => router.push('/dashboard/reports')}
        >
          View Reports
        </Button>
      </div>

      {/* Tabs Section - same style as Calendar page */}
      {tabs && (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-0">
            <Tabs defaultValue={tabs[0]?.id} className="w-full mb-8">
              <TabsList
                className={
                  tabs.length === 2
                    ? 'grid w-full grid-cols-2'
                    : tabs.length === 3
                      ? 'grid w-full grid-cols-3'
                      : tabs.length === 4
                        ? 'grid w-full grid-cols-4'
                        : 'grid w-full grid-cols-5'
                }
              >
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="p-0">
                {children}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">Ministry Information</p>
          <p className="text-blue-800 mt-1">Last activity: {lastActivity}</p>
        </div>
      </div>
    </div>
  )
}
