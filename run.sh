#!/bin/bash
# ============================================================
# run.sh - Start the Node.js DBA App
# Usage: ./run.sh [dev|prod|migrate|seed]
# ============================================================

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/nodejs-dba-app" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check node_modules
if [ ! -d "${APP_DIR}/node_modules" ]; then
  log_warn "node_modules not found. Running npm install..."
  npm install --prefix "${APP_DIR}"
fi

# Check .env
if [ ! -f "${APP_DIR}/.env" ]; then
  log_warn ".env not found. Copying from .env.example..."
  cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
  log_warn "Please edit ${APP_DIR}/.env with your credentials before running."
  exit 1
fi

MODE="${1:-dev}"

case "$MODE" in
  dev)
    log_info "Starting in DEVELOPMENT mode (nodemon)..."
    npm run dev --prefix "${APP_DIR}"
    ;;

  prod)
    log_info "Starting in PRODUCTION mode..."
    npm start --prefix "${APP_DIR}"
    ;;

  migrate)
    log_info "Running database migrations..."
    npm run migrate --prefix "${APP_DIR}"
    log_info "Migration complete."
    ;;

  seed)
    log_info "Running database seed..."
    npm run seed --prefix "${APP_DIR}"
    log_info "Seed complete."
    ;;

  setup)
    log_info "Running full setup: migrate + seed..."
    npm run migrate --prefix "${APP_DIR}"
    npm run seed --prefix "${APP_DIR}"
    log_info "Setup complete. Run './run.sh dev' to start the app."
    ;;

  *)
    echo "Usage: $0 {dev|prod|migrate|seed|setup}"
    echo ""
    echo "  dev      - Start with nodemon (auto-reload)"
    echo "  prod     - Start in production mode"
    echo "  migrate  - Run database migrations"
    echo "  seed     - Seed initial data"
    echo "  setup    - Run migrate + seed"
    exit 1
    ;;
esac
