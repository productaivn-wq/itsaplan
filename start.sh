#!/usr/bin/env bash
# 1-Command Zero-Bun / Zero-Node Docker Launcher for ItsAPlan (macOS / Linux)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CHECK_ONLY=0
PULL_MODE=0
for arg in "$@"; do
  case "$arg" in
    --check|--dry-run) CHECK_ONLY=1 ;;
    --pull) PULL_MODE=1 ;;
  esac
done

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  echo "[CHECK] ItsAPlan Zero-Bun Docker Launcher (macOS/Linux)"
  echo "[CHECK] Repo root: $SCRIPT_DIR"
  echo "[CHECK] Actions  : verify docker -> auto-generate .env secrets if missing -> docker compose up -d"
  exit 0
fi

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker is not running. Start Docker Desktop (or OrbStack) and re-run 'bash start.sh'." >&2
  exit 1
fi

_rand_hex() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 24
  else
    LC_ALL=C tr -dc 'a-f0-9' </dev/urandom | head -c 48
  fi
}

if [[ ! -f .env ]]; then
  echo "[1/3] Generating .env with fresh local secrets (zero Bun/Node required)..."
  cp .env.example .env
  PG_PW="$(_rand_hex)"
  AUTH_SEC="$(_rand_hex)"
  ENC_KEY="$(_rand_hex)"
  S3_KEY="rustfs$(_rand_hex | head -c 10)"
  S3_SEC="$(_rand_hex)"
  TMP_ENV="$(mktemp)"
  awk -v pg="$PG_PW" -v auth="$AUTH_SEC" -v enc="$ENC_KEY" -v s3k="$S3_KEY" -v s3s="$S3_SEC" '
    /^POSTGRES_PASSWORD=/ { print "POSTGRES_PASSWORD=" pg; next }
    /^DATABASE_URL=/ { print "DATABASE_URL=postgres://itsaplan:" pg "@localhost:5432/itsaplan"; next }
    /^BETTER_AUTH_SECRET=/ { print "BETTER_AUTH_SECRET=" auth; next }
    /^APP_ENCRYPTION_KEY=/ { print "APP_ENCRYPTION_KEY=" enc; next }
    /^S3_ACCESS_KEY_ID=/ { print "S3_ACCESS_KEY_ID=" s3k; next }
    /^S3_SECRET_ACCESS_KEY=/ { print "S3_SECRET_ACCESS_KEY=" s3s; next }
    { print }
  ' .env > "$TMP_ENV" && mv "$TMP_ENV" .env
else
  echo "[1/3] Using existing .env"
fi

if [[ "$PULL_MODE" -eq 1 ]]; then
  echo "[2/3] Pulling images and starting Docker stack..."
  docker compose pull
  docker compose up -d
else
  echo "[2/3] Building and starting Docker stack..."
  docker compose up -d --build
fi

echo "[3/3] Waiting for ItsAPlan Web UI at http://localhost:3001 ..."
for _ in $(seq 1 45); do
  if command -v curl >/dev/null 2>&1 && curl -fsS -o /dev/null http://127.0.0.1:3001; then
    echo "[OK] ItsAPlan is ready at http://localhost:3001"
    exit 0
  fi
  sleep 2
done
echo "[WARN] Stack started; open http://localhost:3001 once containers finish warming up."
