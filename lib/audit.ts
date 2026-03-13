/**
 * Log a critical action to the audit log. Call from client after successful mutations.
 */
export async function logAudit(params: {
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, unknown>
}): Promise<void> {
  try {
    await fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch {
    // Non-blocking; ignore failures
  }
}
