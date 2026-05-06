#!/bin/zsh

# Runbook AI - Start/Stop Script
# Usage: ./run.sh [start|stop|restart|status|9router]

APP_DIR="$HOME/web/redis-mysql/nodejs-dba-app"
APP_NAME="nodejs-dba-app"
PID_FILE="/tmp/runbook-ai.pid"
LOG_FILE="$APP_DIR/app.log"

export PATH="$HOME/.bun/bin:$PATH"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "${GREEN}✓ App is running${NC} (PID: $PID)"
            echo "  URL: http://localhost:3000"
            return 0
        else
            rm -f "$PID_FILE"
            echo "${RED}✗ App is not running${NC} (stale PID file removed)"
            return 1
        fi
    else
        echo "${RED}✗ App is not running${NC}"
        return 1
    fi
}

run_9router() {
    echo "${YELLOW}Running 9router...${NC}"
    cd "$APP_DIR" || exit 1
    nohup 9router > "$APP_DIR/9router.log" 2>&1 &
    echo $! > "/tmp/9router.pid"
    sleep 2
    if ps -p $(cat "/tmp/9router.pid") > /dev/null 2>&1; then
        echo "${GREEN}✓ 9router started${NC} (PID: $(cat "/tmp/9router.pid"))"
        echo "  Log: $APP_DIR/9router.log"
    else
        echo "${RED}✗ Failed to start 9router${NC}"
        rm -f "/tmp/9router.pid"
        return 1
    fi
}

start_app() {
    echo "${YELLOW}Starting Runbook AI...${NC}"
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "${RED}✗ App is already running${NC} (PID: $PID)"
            return 1
        fi
    fi
    
    cd "$APP_DIR" || exit 1
    
    # Check if port 3000 is in use
    if lsof -i:3000 > /dev/null 2>&1; then
        echo "${YELLOW}Warning: Port 3000 is in use. Attempting to free it...${NC}"
        kill $(lsof -t -i:3000) 2>/dev/null || true
        sleep 2
    fi
    
    echo "  Starting Bun server..."
    nohup bun src/app.js > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 3
    
    if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        echo "${GREEN}✓ App started successfully${NC} (PID: $(cat "$PID_FILE"))"
        echo "  URL: http://localhost:3000"
        echo "  Logs: $LOG_FILE"
    else
        echo "${RED}✗ Failed to start app${NC}"
        echo "  Check logs: $LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop_app() {
    echo "${YELLOW}Stopping Runbook AI...${NC}"
    
    if [ ! -f "$PID_FILE" ]; then
        echo "${RED}✗ App is not running${NC}"
        # Kill any process on port 3000 just in case
        if lsof -i:3000 > /dev/null 2>&1; then
            echo "  Cleaning up port 3000..."
            kill $(lsof -t -i:3000) 2>/dev/null || true
        fi
        return 0
    fi
    
    PID=$(cat "$PID_FILE")
    
    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null
        sleep 2
        
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "${RED}✗ Failed to stop app${NC}"
            return 1
        else
            rm -f "$PID_FILE"
            echo "${GREEN}✓ App stopped successfully${NC}"
        fi
    else
        rm -f "$PID_FILE"
        echo "${GREEN}✓ App stopped${NC} (was not running)"
    fi
    
    # Ensure port 3000 is free
    if lsof -i:3000 > /dev/null 2>&1; then
        echo "  Cleaning up port 3000..."
        kill $(lsof -t -i:3000) 2>/dev/null || true
    fi
}

case "$1" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        sleep 2
        start_app
        ;;
    status)
        check_status
        ;;
    9router)
        run_9router
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|9router}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the application"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  status  - Check application status"
        echo "  9router - Run 9router command"
        exit 1
        ;;
esac
