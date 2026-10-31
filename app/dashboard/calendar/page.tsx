import { CalendarView } from '@/components/events/calendar-view'
import { requirePageRole } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'

// Every signed-in role can open the calendar (events are member-readable). Only the roles that may
// manage events (PAGE_ACCESS.events, the same as the API and the staff write policies) get the
// add and manage buttons; the API refuses everyone else anyway.
export default async function CalendarPage() {
  const { role } = await requirePageRole()
  return <CalendarView canEdit={!!role && PAGE_ACCESS.events.includes(role)} />
}
