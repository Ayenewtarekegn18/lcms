'use client'

import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { aidRequestsTab, distributionsTab } from '@/components/ministry/charity/charity-tabs'

// Charity ministry: Overview, Members and Events come with MinistryWorkspace. Aid requests and
// Distributions are confidential (admin and elder only, like their RLS), with the totals above each list.
export default function CharityPage() {
  return <MinistryWorkspace slug="charity" tabs={[aidRequestsTab, distributionsTab]} />
}
