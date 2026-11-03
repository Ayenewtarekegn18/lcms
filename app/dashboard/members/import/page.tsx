import { Page, PageHeader } from '@/components/app'
import { MemberImport } from '@/components/members/import/member-import'

export default function ImportMembersPage() {
  return (
    <Page>
      <PageHeader
        back={{ href: '/dashboard/members', label: 'Members' }}
        title="Import members"
        subtitle="Bring records from the lebu-form register into the app, with their member numbers and photos."
      />
      <MemberImport />
    </Page>
  )
}
