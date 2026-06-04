#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGDATA="$ROOT_DIR/.dev/postgres"
VALKEY_PID="$ROOT_DIR/.dev/run/valkey.pid"

if command -v pg_ctl >/dev/null 2>&1 && [ -f "$PGDATA/PG_VERSION" ] && pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
  pg_ctl -D "$PGDATA" stop -m fast >/dev/null
fi

if [ -f "$VALKEY_PID" ]; then
  PID="$(cat "$VALKEY_PID")"
  if kill -0 "$PID" >/dev/null 2>&1; then
    kill "$PID"
  fi
  rm -f "$VALKEY_PID"
fi

echo "Local dev services stopped."
