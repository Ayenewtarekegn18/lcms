#!/usr/bin/env bash
# Proves every migration is reversible: for each migration (newest first) the schema after
# down + up must be byte-identical to the schema before. Then rolls everything back, checks
# the database is back to its starting point, migrates up again and runs verify_security.sql.
#
# Needs a THROWAWAY database that already has db/tests/supabase_shim.sql applied.
#   DATABASE_URL  postgres URL for dbmate (e.g. postgres://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable)
#   PSQL          command that runs psql against the same database (default: psql "$DATABASE_URL")
#   PG_DUMP       command that runs pg_dump against the same database (default: pg_dump "$DATABASE_URL")
set -euo pipefail
node "$(dirname "$0")/check_emergency_script.mjs"
cd "$(dirname "$0")/../.."

PSQL=${PSQL:-psql "$DATABASE_URL"}
PG_DUMP=${PG_DUMP:-pg_dump "$DATABASE_URL"}
DBMATE="npx dbmate --no-dump-schema --migrations-table dbmate.schema_migrations"
# dbmate has no "up to version X": give it a directory holding only the migrations up to $1
upto() { local dir; dir=$(mktemp -d); for f in db/migrations/*.sql; do cp "$f" "$dir/"; [ "$(basename "$f")" = "$1" ] && break; done; echo "$dir"; }
# Schema dump for comparison. Runs of GRANT/REVOKE lines are sorted: privileges restored by a
# down migration can land in a different ACL order without being different.
dump() {
  $PG_DUMP --schema-only --no-owner --exclude-schema=dbmate \
    | grep -v -E '^-- Dumped (from|by)|^\\(un)?restrict ' \
    | perl -ne 'if (/^(GRANT|REVOKE) /) { push @b, $_ } else { print sort @b; @b = (); print } END { print sort @b }'
}

DB=$($PSQL -tA -c "SELECT current_database()")
setflag() { $PSQL -q -c "ALTER DATABASE \"$DB\" $1" >/dev/null; }
setflag "RESET lkhc.allow_insecure_downgrade"
start=$(dump)

echo "== migrate up"
$DBMATE up >/dev/null
$PSQL -q -v ON_ERROR_STOP=1 < db/tests/verify_security.sql
versions=($(ls db/migrations/*.sql | sort -r))   # (no mapfile: macOS ships bash 3.2)

echo "== security migrations refuse to roll back without the explicit flag"
# roll back everything newer than the RLS rewrite, then try the RLS rewrite itself: it must refuse
while read -r v; do
  name=$(basename "$v")
  [[ "$name" == *_rls_rewrite.sql ]] && break
  $DBMATE rollback >/dev/null
done < <(ls db/migrations/*.sql | sort -r)
if out=$($DBMATE rollback 2>&1); then echo "FAIL: rls_rewrite rolled back without lkhc.allow_insecure_downgrade"; exit 1; fi
echo "$out" | grep -q "Refusing to roll back a security migration" || { echo "FAIL: rollback failed for another reason:"; echo "$out" | tail -5; exit 1; }
echo "   ok: refused"
echo "== verify_security on a partly migrated database (later tables absent, as on a live project mid-upgrade)"
$PSQL -q -v ON_ERROR_STOP=1 < db/tests/verify_security.sql
$DBMATE up >/dev/null

setflag "SET lkhc.allow_insecure_downgrade = 'on'"

echo "== per-migration round trip (down then up must restore the identical schema)"
for v in "${versions[@]}"; do
  name=$(basename "$v" .sql)
  before=$(dump)
  $DBMATE rollback >/dev/null
  $DBMATE -d "$(upto "$name.sql")" up >/dev/null
  after=$(dump)
  if [ "$before" != "$after" ]; then
    echo "FAIL: $name is not reversible"; diff <(echo "$before") <(echo "$after") | head -40; exit 1
  fi
  $DBMATE rollback >/dev/null
  echo "   ok  $name"
done

echo "== everything rolled back: schema equals the starting point"
end=$(dump)
if [ "$start" != "$end" ]; then echo "FAIL: leftover objects after full rollback"; diff <(echo "$start") <(echo "$end") | head -40; exit 1; fi
echo "   ok"

setflag "RESET lkhc.allow_insecure_downgrade"
echo "== migrate up again + verify_security"
$DBMATE up >/dev/null
$PSQL -q -v ON_ERROR_STOP=1 < db/tests/verify_security.sql
echo "ROUND TRIP PASSED"
