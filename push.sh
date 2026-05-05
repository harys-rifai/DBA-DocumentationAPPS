#!/bin/bash
# ============================================================
# push.sh - Initialize git repo and push to GitHub
# Repository: https://github.com/harys-rifai/DBA-DocumentationAPPS
# Usage: ./push.sh [commit message]
# ============================================================

set -euo pipefail

REMOTE_URL="https://github.com/harys-rifai/DBA-DocumentationAPPS.git"
BRANCH="main"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${CYAN}[STEP]${NC}  $1"; }

COMMIT_MSG="${1:-chore: update project files}"

# ── 1. Init git if not already ────────────────────────────────
if [ ! -d ".git" ]; then
  log_step "Initializing git repository..."
  git init
  log_info "Git initialized."
else
  log_info "Git repository already initialized."
fi

# ── 2. Create/update .gitignore ───────────────────────────────
log_step "Ensuring .gitignore is in place..."
if [ ! -f ".gitignore" ]; then
cat > .gitignore << 'EOF'
# Node
nodejs-dba-app/node_modules/
nodejs-dba-app/logs/
nodejs-dba-app/.env

# OS
.DS_Store
Thumbs.db

# Logs
*.log
EOF
  log_info ".gitignore created."
fi

# ── 3. Set remote origin ──────────────────────────────────────
log_step "Setting remote origin..."
if git remote get-url origin &>/dev/null; then
  log_warn "Remote 'origin' already exists. Updating URL..."
  git remote set-url origin "${REMOTE_URL}"
else
  git remote add origin "${REMOTE_URL}"
fi
log_info "Remote origin: ${REMOTE_URL}"

# ── 4. Stage all files ────────────────────────────────────────
log_step "Staging files..."
git add .
STAGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
log_info "${STAGED} file(s) staged."

# ── 5. Commit ─────────────────────────────────────────────────
if git diff --cached --quiet; then
  log_warn "Nothing to commit. Working tree is clean."
else
  log_step "Committing: \"${COMMIT_MSG}\""
  git commit -m "${COMMIT_MSG}"
  log_info "Commit created."
fi

# ── 6. Set branch to main ─────────────────────────────────────
log_step "Setting branch to '${BRANCH}'..."
git branch -M "${BRANCH}"

# ── 7. Push ───────────────────────────────────────────────────
log_step "Pushing to origin/${BRANCH}..."
git push -u origin "${BRANCH}"

log_info "✅ Push complete!"
log_info "   Repository: ${REMOTE_URL}"
log_info "   Branch:     ${BRANCH}"
