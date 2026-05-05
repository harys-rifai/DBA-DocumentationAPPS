#!/bin/bash
# mysql_service.sh
# Script untuk start/stop MySQL via Homebrew dan set password root
MYSQL_PWD="Password09"
echo "=== MySQL Service Manager ==="
case "$1" in
  start)
    echo "[INFO] Starting MySQL service..."
    brew services start mysql
    echo "[INFO] Setting root password..."
    mysqladmin -u root password "$MYSQL_PWD" 2>/dev/null || \
    mysqladmin -u root -p password "$MYSQL_PWD"

    echo "[INFO] Testing login..."
    mysql -u root -p"$MYSQL_PWD" -e "SELECT VERSION();"
    ;;
  stop)
    echo "[INFO] Stopping MySQL service..."
    brew services stop mysql
    ;;
  restart)
    echo "[INFO] Restarting MySQL service..."
    brew services stop mysql
    brew services start mysql
    ;;
  status)
    echo "[INFO] Checking service list..."
    brew services list | grep mysql
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    ;;
esac