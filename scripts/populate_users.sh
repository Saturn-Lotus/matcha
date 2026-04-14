#!/bin/bash
# populate_users.sh
# Seeds the database with 500 randomised users via populate_users.sql.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env at project root
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_ROOT/.env"
  set +a
else
  echo "Error: .env file not found at $PROJECT_ROOT/.env" >&2
  exit 1
fi

if [ -z "${POSTGRES_CONNECTION_STRING:-}" ]; then
  echo "Error: POSTGRES_CONNECTION_STRING is not set" >&2
  exit 1
fi

echo "Seeding database with 500 users..."

# Normalize common invalid sslmode values for psql compatibility
# valid sslmode values: disable|allow|prefer|require|verify-ca|verify-full
if [[ "${POSTGRES_CONNECTION_STRING}" == *"sslmode=enable"* ]]; then
  echo "Notice: converting sslmode=enable -> sslmode=require"
  POSTGRES_CONNECTION_STRING="${POSTGRES_CONNECTION_STRING//sslmode=enable/sslmode=require}"
fi

if [[ "${POSTGRES_CONNECTION_STRING}" == *"sslmode=on"* ]]; then
  echo "Notice: converting sslmode=on -> sslmode=require"
  POSTGRES_CONNECTION_STRING="${POSTGRES_CONNECTION_STRING//sslmode=on/sslmode=require}"
fi

psql "$POSTGRES_CONNECTION_STRING" -f "$SCRIPT_DIR/populate_users.sql"
echo "Done."
