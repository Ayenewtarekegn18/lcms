'use client'

import { Lock } from 'lucide-react'
import { EmptyState } from '@/components/app/empty-state'
import { PASTORAL } from '@/lib/auth/roles'
import { ResourceTab } from './resource-tab'
import { isCustomTab, type CustomTab, type WorkspaceTab } from './types'

/**
 * A tab on a confidential table (RLS: admin and elder only). Other staff who open the ministry see a
 * short "confidential" note instead of a list their role may not load.
 *
 *   tabs={[pastoralOnly(careVisits), pastoralOnly(supportCases)]}
 */
export function pastoralOnly(tab: WorkspaceTab): CustomTab {
  return {
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
    render: (ctx) => {
      if (!PASTORAL.includes(ctx.role)) {
        return (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <EmptyState
              icon={Lock}
              title={`${tab.label} are confidential.`}
              description="Only administrators and elders can see and record them."
            />
          </div>
        )
      }
      return isCustomTab(tab) ? tab.render(ctx) : <ResourceTab config={tab} ctx={ctx} />
    },
  }
}
