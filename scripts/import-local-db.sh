#!/usr/bin/env bash

set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-afohs-club}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DUMP_PATH="${DUMP_PATH:-database/dumps/afohs-club.sql.gz}"

if [[ ! -f "$DUMP_PATH" ]]; then
  echo "Dump file not found: $DUMP_PATH" >&2
  exit 1
fi

mysql_cmd=(
  mysql
  -u "$DB_USER"
  -h "$DB_HOST"
  -P "$DB_PORT"
  --protocol=TCP
)

if [[ -n "$DB_PASSWORD" ]]; then
  mysql_cmd+=(-p"$DB_PASSWORD")
fi

"${mysql_cmd[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;"

gzip -dc "$DUMP_PATH" | "${mysql_cmd[@]}" "$DB_NAME"

echo "Imported $DUMP_PATH into $DB_NAME"
