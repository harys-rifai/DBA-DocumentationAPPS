#!/bin/bash
# ============================================================
# Redis Service Management Script
# Usage: ./scripts/redis_service.sh [start|stop|restart|status|monitor|flush]
# ============================================================

set -euo pipefail

REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
REDIS_PASS="Password09"
REDIS_CLI="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} -a ${REDIS_PASS}"

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
    log_info "Starting Redis..."
    brew services start redis
    log_info "Redis started."
    ;;

  stop)
    log_info "Stopping Redis..."
    brew services stop redis
    log_info "Redis stopped."
    ;;

  restart)
    log_info "Restarting Redis..."
    brew services restart redis
    log_info "Redis restarted."
    ;;

  status)
    log_info "Redis service status:"
    brew services info redis
    ;;

  monitor)
    log_info "Redis monitoring info:"
    ${REDIS_CLI} INFO memory | grep -E "used_memory_human|maxmemory_human|mem_fragmentation_ratio"
    echo "---"
    ${REDIS_CLI} INFO stats | grep -E "total_commands_processed|keyspace_hits|keyspace_misses|evicted_keys"
    echo "---"
    ${REDIS_CLI} INFO keyspace
    echo "---"
    log_info "Connected clients: $(${REDIS_CLI} CLIENT LIST | wc -l)"
    ;;

  flush)
    log_warn "This will flush ALL Redis data. Press Ctrl+C to cancel (5s)..."
    sleep 5
    ${REDIS_CLI} FLUSHALL
    log_info "Redis flushed."
    ;;

  ping)
    RESULT=$(${REDIS_CLI} PING 2>/dev/null)
    if [ "${RESULT}" = "PONG" ]; then
      log_info "Redis is reachable: PONG"
    else
      log_error "Redis is NOT reachable."
      exit 1
    fi
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|status|monitor|flush|ping}"
    exit 1
    ;;
esac
