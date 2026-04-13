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
psql "$POSTGRES_CONNECTION_STRING" -f "$SCRIPT_DIR/populate_users.sql"
echo "Done."
