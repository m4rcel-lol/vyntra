#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.dev/run"
PGDATA="$ROOT_DIR/.dev/postgres"
VALKEY_DIR="$ROOT_DIR/.dev/valkey"

mkdir -p "$RUN_DIR" "$PGDATA" "$VALKEY_DIR"

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

need_command pg_ctl
need_command initdb
need_command psql
need_command createdb
need_command valkey-server

if ! pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
  if [ ! -f "$PGDATA/PG_VERSION" ]; then
    initdb -D "$PGDATA" -U vyntra --auth=trust --encoding=UTF8 --no-locale >/dev/null
  fi
  pg_ctl -D "$PGDATA" -l "$RUN_DIR/postgres.log" -o "-p 5432 -h 127.0.0.1" start >/dev/null
fi

if ! psql -h 127.0.0.1 -p 5432 -U vyntra -d postgres -tAc "SELECT 1" >/dev/null 2>&1; then
  if psql -h 127.0.0.1 -p 5432 -d postgres -tAc "SELECT 1" >/dev/null 2>&1; then
    if [ "$(psql -h 127.0.0.1 -p 5432 -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'vyntra'" 2>/dev/null || true)" != "1" ]; then
      psql -h 127.0.0.1 -p 5432 -d postgres -c "CREATE ROLE vyntra LOGIN CREATEDB" >/dev/null
    fi
  fi
fi

if ! psql -h 127.0.0.1 -p 5432 -U vyntra -d vyntra -tAc "SELECT 1" >/dev/null 2>&1; then
  createdb -h 127.0.0.1 -p 5432 -U vyntra -O vyntra vyntra >/dev/null
fi

if ! (echo > /dev/tcp/127.0.0.1/6379) >/dev/null 2>&1; then
  valkey-server \
    --daemonize yes \
    --bind 127.0.0.1 \
    --port 6379 \
    --dir "$VALKEY_DIR" \
    --appendonly yes \
    --pidfile "$RUN_DIR/valkey.pid" \
    --logfile "$RUN_DIR/valkey.log"
fi

echo "Local dev services ready: PostgreSQL 127.0.0.1:5432, Valkey 127.0.0.1:6379"
