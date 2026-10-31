'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Clock, Crown, LayoutGrid, MapPin, SearchX, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/app/empty-state'
import { Page, PageHeader } from '@/components/app/page-header'
import { StatCard } from '@/components/app/stat-card'
import { readApiError } from '@/lib/api/client-errors'
import { meetingLabel, type MinistryWorkspaceData } from '@/lib/ministries/workspace'
import { EventsTab } from './events-tab'
import { membersTab } from './members-tab'
import { ministryIcon } from './ministry-icons'
import { OverviewTab } from './overview-tab'
import { ResourceTab } from './resource-tab'
import { isCustomTab, type WorkspaceContext, type WorkspaceTab } from './types'

type Props = {
  /** The ministry's slug (ministries.slug, the folder name under app/dashboard/ministry). */
  slug: string
  /** The ministry's own tabs, after Overview, Members and Events. See docs/MINISTRY_WORKSPACES.md. */
  tabs?: WorkspaceTab[]
}

type Load = { state: 'loading' } | { state: 'missing' } | { state: 'failed'; message: string } | { state: 'ready'; data: MinistryWorkspaceData }

const BUILT_IN: WorkspaceTab[] = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid, render: (ctx) => <OverviewTab ctx={ctx} /> },
  membersTab,
  { key: 'events', label: 'Events', icon: CalendarDays, render: (ctx) => <EventsTab ctx={ctx} /> },
]

/**
 * A ministry's workspace page: its header (English and Amharic name, meeting time, place), key
 * figures, and tabs: Overview, Members, Events, then the ministry's own tabs.
 *
 *   <MinistryWorkspace slug="choir" tabs={[voicePartsTab, songsTab, scheduleTab]} />
 */
export function MinistryWorkspace({ slug, tabs = [] }: Props) {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [version, setVersion] = useState(0)
  const [tab, setTab] = useState('overview')
  const allTabs = [...BUILT_IN, ...tabs]

  useEffect(() => {
    const ctl = new AbortController()
    fetch(`/api/ministries/by-slug/${encodeURIComponent(slug)}`, { signal: ctl.signal, cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 404) return setLoad({ state: 'missing' })
        if (!res.ok) return setLoad({ state: 'failed', message: (await readApiError(res, 'Could not load this ministry.')).message })
        setLoad({ state: 'ready', data: (await res.json()) as MinistryWorkspaceData })
      })
      .catch(() => { if (!ctl.signal.aborted) setLoad({ state: 'failed', message: 'Could not load this ministry. Check your connection.' }) })
    return () => ctl.abort()
  }, [slug, version])

  // The open tab lives in the URL hash (#songs), so a reload or a shared link opens the same tab.
  useEffect(() => {
    const fromHash = decodeURIComponent(window.location.hash.slice(1))
    if (fromHash) setTab(fromHash)
  }, [])
  const openTab = useCallback((key: string) => {
    setTab(key)
    window.history.replaceState(null, '', `#${encodeURIComponent(key)}`)
  }, [])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  const Icon = ministryIcon(slug)
  const back = { href: '/dashboard/ministry', label: 'All ministries' }

  if (load.state === 'missing' || load.state === 'failed') {
    return (
      <Page>
        <PageHeader title="Ministry" back={back} />
        <div className="rounded-xl border border-border bg-card">
          {load.state === 'missing' ? (
            <EmptyState icon={SearchX} title="This ministry has no workspace yet."
              description={`No ministry has the slug “${slug}”. Ask an administrator to apply the latest database migration.`} />
          ) : (
            <EmptyState title="The ministry could not be loaded." description={load.message}
              action={<Button variant="outline" onClick={refresh}>Try again</Button>} />
          )}
        </div>
      </Page>
    )
  }

  const data = load.state === 'ready' ? load.data : null
  const ministry = data?.ministry
  const meeting = ministry ? meetingLabel(ministry) : null
  const ctx: WorkspaceContext | null = data ? { ministry: data.ministry, data, role: data.viewer.role, refresh, openTab } : null
  const activeTab = allTabs.some((t) => t.key === tab) ? tab : 'overview'

  return (
    <Page>
      <PageHeader
        back={back}
        icon={
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Icon className="size-7" aria-hidden />
          </span>
        }
        title={ministry?.name ?? <span className="inline-block h-8 w-56 animate-pulse rounded bg-muted align-middle" aria-label="Loading" />}
        subtitle={ministry?.name_am}
        meta={[
          meeting && <><Clock aria-hidden />{meeting}</>,
          ministry?.location && <><MapPin aria-hidden />{ministry.location}</>,
        ]}
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Members" value={data?.member_count ?? null} icon={Users} />
        <StatCard label="Leaders" value={data?.leaders.length ?? null} icon={Crown} />
        <StatCard label="Upcoming events" value={data?.upcoming_events ?? null} icon={CalendarDays} />
      </div>

      <Tabs value={activeTab} onValueChange={openTab} className="gap-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto p-1 sm:w-fit">
          {allTabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="flex-none px-3 py-1.5">
              {t.icon && <t.icon aria-hidden />}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {allTabs.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            {!ctx ? (
              <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
            ) : isCustomTab(t) ? (
              t.render(ctx)
            ) : (
              <ResourceTab config={t} ctx={ctx} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Page>
  )
}
