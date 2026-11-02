// Mission ministry values shared by the API schemas (lib/api/schemas.ts) and the mission page. No server code here.

export const MISSION_TRIP_STATUSES = ['planned', 'ongoing', 'completed', 'cancelled'] as const
export type MissionTripStatus = (typeof MISSION_TRIP_STATUSES)[number]

const TRIP_STATUS_LABELS: Record<MissionTripStatus, string> = {
  planned: 'Planned',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
export const MISSION_TRIP_STATUS_OPTIONS = MISSION_TRIP_STATUSES.map((value) => ({ value, label: TRIP_STATUS_LABELS[value] }))

/** A trip's status for display; empty reads as 'Planned' (the column default), unknown text as itself. */
export function tripStatusLabel(status: string | null | undefined): string {
  if (!status) return TRIP_STATUS_LABELS.planned
  return TRIP_STATUS_LABELS[status as MissionTripStatus] ?? status
}

/** A trip in a picker: "Title · 4 May 2030", or the title alone when it has no date. */
export function tripOptionLabel(
  trip: { title: string; trip_date: string | null },
  formatDate: (d: string) => string | null,
): string {
  const when = trip.trip_date ? formatDate(trip.trip_date) : null
  return when ? `${trip.title} · ${when}` : trip.title
}
