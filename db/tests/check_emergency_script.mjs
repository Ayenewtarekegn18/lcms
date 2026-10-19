// db/scripts/emergency_lockdown.sql (pasted into the SQL editor before dbmate is adopted) must stay
// identical to the up section of the emergency-lockdown migration. Fails if the two drift apart.
import fs from 'node:fs'

const migration = fs.readFileSync(new URL('../migrations/20261019000001_emergency_lockdown.sql', import.meta.url), 'utf8')
const script = fs.readFileSync(new URL('../scripts/emergency_lockdown.sql', import.meta.url), 'utf8')

// up section without the migration's own header comment (the leading run of "-- " lines)
const upLines = migration.split('-- migrate:up')[1].split('-- migrate:down')[0].trim().split('\n')
while (upLines.length && upLines[0].startsWith('-- ')) upLines.shift()
const up = upLines.join('\n').trim()
const body = script.split(/^BEGIN;$/m)[1].split(/^COMMIT;$/m)[0].trim()

if (up !== body) {
  console.error('emergency_lockdown.sql and migration 20261019000001 differ; update both together')
  process.exit(1)
}
console.log('ok: emergency_lockdown.sql matches migration 20261019000001')
