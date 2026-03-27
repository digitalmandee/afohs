#!/usr/bin/env bash

set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-afohs-club}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DUMP_PATH="${DUMP_PATH:-database/dumps/${DB_NAME}-$(date +%Y%m%d-%H%M%S).sql.gz}"

mkdir -p "$(dirname "$DUMP_PATH")"

dump_cmd=(
  mysqldump
  -u "$DB_USER"
  -h "$DB_HOST"
  -P "$DB_PORT"
  --protocol=TCP
  --set-gtid-purged=OFF
  --single-transaction
  --routines
  --triggers
  --events
  --databases "$DB_NAME"
)

if [[ -n "$DB_PASSWORD" ]]; then
  dump_cmd+=(-p"$DB_PASSWORD")
fi

"${dump_cmd[@]}" | gzip > "$DUMP_PATH"

echo "Exported $DB_NAME to $DUMP_PATH"
