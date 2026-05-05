#!/bin/bash
# ============================================================
# MySQL Service Management Script
# Usage: ./scripts/mysql_service.sh [start|stop|restart|status|backup|restore]
# ============================================================

set -euo pipefail

MYSQL_USER="root"
MYSQL_PASS="Password09"
BACKUP_DIR="/opt/homebrew/var/mysql/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

case "${1:-help}" in
  start)
    log_info "Starting MySQL..."
    brew services start mysql
    log_info "MySQL started."
    ;;

  stop)
    log_info "Stopping MySQL..."
    brew services stop mysql
    log_info "MySQL stopped."
    ;;

  restart)
    log_info "Restarting MySQL..."
    brew services restart mysql
    log_info "MySQL restarted."
    ;;

  status)
    log_info "MySQL service status:"
    brew services info mysql
    ;;

  backup)
    log_info "Starting MySQL backup..."
    mkdir -p "${BACKUP_DIR}"
    mysqldump -u "${MYSQL_USER}" -p"${MYSQL_PASS}" \
      --all-databases \
      --triggers \
      --routines \
      --events \
      --single-transaction \
      --set-gtid-purged=OFF \
      > "${BACKUP_FILE}"
    gzip "${BACKUP_FILE}"
    log_info "Backup saved to: ${BACKUP_FILE}.gz"
    # Keep only last 7 backups
    ls -t "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs rm -f
    log_info "Old backups cleaned up (keeping last 7)."
    ;;

  restore)
    if [ -z "${2:-}" ]; then
      log_error "Usage: $0 restore <backup_file.sql.gz>"
      exit 1
    fi
    log_warn "Restoring from: $2"
    log_warn "This will overwrite existing data. Press Ctrl+C to cancel (5s)..."
    sleep 5
    if [[ "$2" == *.gz ]]; then
      gunzip -c "$2" | mysql -u "${MYSQL_USER}" -p"${MYSQL_PASS}"
    else
      mysql -u "${MYSQL_USER}" -p"${MYSQL_PASS}" < "$2"
    fi
    log_info "Restore completed."
    ;;

  monitor)
    log_info "MySQL monitoring info:"
    mysql -u "${MYSQL_USER}" -p"${MYSQL_PASS}" -e "
      SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
      SHOW VARIABLES LIKE 'max_connections';
      SHOW VARIABLES LIKE 'slow_query_log';
      SHOW STATUS LIKE 'Threads_connected';
      SHOW STATUS LIKE 'Slow_queries';
    "
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|status|backup|restore|monitor}"
    exit 1
    ;;
esac
