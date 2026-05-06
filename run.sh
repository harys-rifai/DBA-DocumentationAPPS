#!/bin/zsh
# ==========================================================
# run.sh - Start the Bun + Prisma + PostgreSQL DBA App
# Usage: ./run.sh [dev|prod|migrate|seed|setup]
# ==========================================================

set -euo pipefail

# Load zsh environment
source ~/.zshrc 2>/dev/null || true

APP_DIR="$(cd "$(dirname "$0")/nodejs-dba-app" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Add Bun to PATH
export PATH="$HOME/.bun/bin:$PATH"

# Check Bun
if ! command -v bun &> /dev/null; then
  log_error "Bun is not installed. Please install it first:"
  echo "  curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

# Check node_modules
if [ ! -d "${APP_DIR}/node_modules" ]; then
  log_warn "node_modules not found. Running bun install..."
  bun install --prefix "${APP_DIR}"
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
    log_info "Starting in DEVELOPMENT mode (Bun --hot)..."
    cd "${APP_DIR}" && bun --hot src/app.js
    ;;

  prod)
    log_info "Starting in PRODUCTION mode..."
    cd "${APP_DIR}" && bun run start
    ;;

  migrate)
    log_info "Running database migrations..."
    cd "${APP_DIR}" && bun run prisma:migrate
    log_info "Migration complete."
    ;;

  seed)
    log_info "Running database seed..."
    cd "${APP_DIR}" && bun run prisma:seed
    log_info "Seed complete."
    ;;

  setup)
    log_info "Running full setup: migrate + seed..."
    cd "${APP_DIR}" && bun run prisma:migrate && bun run prisma:seed
    log_info "Setup complete. Run './run.sh dev' to start the app."
    ;;

  *)
    echo "Usage: $0 {dev|prod|migrate|seed|setup}"
    echo ""
    echo "  dev      - Start with Bun --hot (auto-reload)"
    echo "  prod     - Start in production mode"
    echo "  migrate  - Run Prisma database migrations"
    echo "  seed     - Seed initial data"
    echo "  setup    - Run migrate + seed"
    exit 1
    ;;
esac
