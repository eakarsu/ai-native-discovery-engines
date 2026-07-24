#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"

load_env() {
  local key value
  [ -f "$ENV_FILE" ] || return
  while IFS='=' read -r key value; do
    key="${key#export }"; [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    [ -z "${!key+x}" ] || continue; value="${value%$'\r'}"
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then value="${value:1:${#value}-2}"; elif [[ "$value" == \'*\' && "$value" == *\' ]]; then value="${value:1:${#value}-2}"; fi
    export "$key=$value"
  done < "$ENV_FILE"
}
load_env

fail(){ echo "$*" >&2; exit 1; }
check_config(){
  for key in DATABASE_URL JWT_SECRET DEFAULT_TENANT_ID BACKEND_PORT FRONTEND_PORT OPENROUTER_API_KEY OPENROUTER_MODEL OPENROUTER_BASE_URL PROVISION_ADMIN_EMAIL PROVISION_ADMIN_PASSWORD; do [ -n "${!key:-}" ] || fail "$key is required"; done
  [ "${#JWT_SECRET}" -ge 32 ] || fail "JWT_SECRET must be at least 32 characters"
  [ "$OPENROUTER_BASE_URL" = "https://openrouter.ai/api/v1" ] || fail "OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1"
  case "${ALLOW_SCHEMA_MIGRATION:-}" in true|1) ;; *) fail "ALLOW_SCHEMA_MIGRATION=true is required";; esac
  for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do [[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 1024 ] && [ "$port" -le 65535 ] || fail "runtime ports must be valid integers"; done
  [ "$BACKEND_PORT" != "$FRONTEND_PORT" ] || fail "BACKEND_PORT and FRONTEND_PORT must be distinct"
}
migrate(){ check_config; for sql in "$ROOT_DIR"/backend/db/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$sql"; done; }
start(){
  check_config
  [ -d "$ROOT_DIR/backend/node_modules" ] && [ -d "$ROOT_DIR/frontend/node_modules" ] || fail "dependencies are missing"
  for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && fail "runtime port $port is occupied"; done
  migrate
  (cd "$ROOT_DIR/backend" && npm run create-admin)
  backend_pid=""; frontend_pid=""
  cleanup(){ [ -z "$backend_pid" ] || kill "$backend_pid" 2>/dev/null || true; [ -z "$frontend_pid" ] || kill "$frontend_pid" 2>/dev/null || true; wait "$backend_pid" "$frontend_pid" 2>/dev/null || true; }
  trap cleanup EXIT INT TERM
  (cd "$ROOT_DIR/backend" && BACKEND_HOST=127.0.0.1 PORT="$BACKEND_PORT" CORS_ORIGIN="http://127.0.0.1:$FRONTEND_PORT" npm start) & backend_pid=$!
  (cd "$ROOT_DIR/frontend" && VITE_BACKEND_PORT="$BACKEND_PORT" VITE_FRONTEND_PORT="$FRONTEND_PORT" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort) & frontend_pid=$!
  wait "$backend_pid" "$frontend_pid"
}

case "${1:-start}" in check) (cd "$ROOT_DIR/backend" && npm run check); (cd "$ROOT_DIR/frontend" && npm run build);; migrate) migrate;; start) start;; *) fail 'usage: ./start.sh check|migrate|start';; esac
