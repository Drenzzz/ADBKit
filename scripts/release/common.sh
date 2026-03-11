#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

log() {
  printf '[build] %s\n' "$*"
}

fail() {
  printf '[build][error] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

require_file() {
  [[ -f "$1" ]] || fail "Required file not found: $1"
}

project_version() {
  python3 - <<'PY'
import json
from pathlib import Path

config = Path("wails.json")
data = json.loads(config.read_text(encoding="utf-8"))
print(data["info"]["productVersion"])
PY
}

ensure_frontend_dependencies() {
  log "Installing frontend dependencies"
  pnpm install --frozen-lockfile --dir "$ROOT_DIR/frontend"
}

build_frontend_assets() {
  log "Building frontend assets"
  pnpm --dir "$ROOT_DIR/frontend" build
}
