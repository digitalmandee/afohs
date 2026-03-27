#!/usr/bin/env bash

set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-afohs-club}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DUMP_PATH="${DUMP_PATH:-database/dumps/${DB_NAME}.sql.gz}"
CONFIRM_RESTORE="${CONFIRM_RESTORE:-}"

if [[ "$CONFIRM_RESTORE" != "YES_RESTORE" ]]; then
  echo "Restore blocked. Set CONFIRM_RESTORE=YES_RESTORE to continue." >&2
  exit 1
fi

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

if [[ "$DUMP_PATH" == *.gz ]]; then
  gzip -dc "$DUMP_PATH" | "${mysql_cmd[@]}" "$DB_NAME"
else
  "${mysql_cmd[@]}" "$DB_NAME" < "$DUMP_PATH"
fi

echo "Imported $DUMP_PATH into $DB_NAME"
