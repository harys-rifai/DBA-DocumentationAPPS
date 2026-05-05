#!/bin/bash
# ============================================================
# Initial Database Setup Script
# Creates database, user, and grants privileges
# Usage: ./scripts/setup_db.sh
# ============================================================

set -euo pipefail

MYSQL_ROOT_PASS="Password09"
DB_NAME="homebrew"
DB_USER="dba_user"
DB_PASS="Password09"

GREEN='\033[0;32m'
NC='\033[0m'
log_info() { echo -e "${GREEN}[INFO]${NC}  $1"; }

log_info "Creating database '${DB_NAME}'..."
mysql -u root -p"${MYSQL_ROOT_PASS}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

log_info "Creating user '${DB_USER}'..."
mysql -u root -p"${MYSQL_ROOT_PASS}" -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASS}';"
mysql -u root -p"${MYSQL_ROOT_PASS}" -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';"
mysql -u root -p"${MYSQL_ROOT_PASS}" -e "FLUSH PRIVILEGES;"

log_info "Database setup complete."
log_info "  DB:   ${DB_NAME}"
log_info "  User: ${DB_USER}"
