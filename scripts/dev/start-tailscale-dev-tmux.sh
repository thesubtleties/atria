#!/bin/bash

# Start Tailscale-enabled development environment with Redis + Traefik in tmux

# Get the project root directory (two levels up from this script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Starting Tailscale development environment (Redis + Traefik)...${NC}"
echo -e "${YELLOW}This environment is optimized for mobile/remote testing via Tailscale${NC}"
echo ""

# Create a new tmux session named 'atria-tailscale' or attach if exists
tmux has-session -t atria-tailscale 2>/dev/null
if [ $? != 0 ]; then
    tmux new-session -d -s atria-tailscale
else
    echo -e "${YELLOW}Session 'atria-tailscale' already exists. Killing old session...${NC}"
    tmux kill-session -t atria-tailscale
    sleep 1
    tmux new-session -d -s atria-tailscale
fi

# Rename the first window to 'docker'
tmux rename-window -t atria-tailscale:0 'docker'

# Start docker compose with Tailscale config in the first pane
tmux send-keys -t atria-tailscale:0 "cd '$PROJECT_ROOT' && docker compose -f docker-compose.tailscale-dev.yml up" C-m

# Create a new window for backend logs (split for both instances)
tmux new-window -t atria-tailscale:1 -n 'backends'
tmux send-keys -t atria-tailscale:1 "cd '$PROJECT_ROOT' && sleep 10 && docker compose -f docker-compose.tailscale-dev.yml logs -f backend-1" C-m

# Split for backend-2 logs
tmux split-window -h -t atria-tailscale:1
tmux send-keys -t atria-tailscale:1.1 "cd '$PROJECT_ROOT' && sleep 10 && docker compose -f docker-compose.tailscale-dev.yml logs -f backend-2" C-m

# Create a new window for frontend and traefik logs
tmux new-window -t atria-tailscale:2 -n 'frontend+traefik'
tmux send-keys -t atria-tailscale:2 "cd '$PROJECT_ROOT' && sleep 10 && docker compose -f docker-compose.tailscale-dev.yml logs -f frontend-vite" C-m

# Split for Traefik logs
tmux split-window -h -t atria-tailscale:2
tmux send-keys -t atria-tailscale:2.1 "cd '$PROJECT_ROOT' && sleep 10 && docker compose -f docker-compose.tailscale-dev.yml logs -f traefik" C-m

# Create a new window for Redis monitoring
tmux new-window -t atria-tailscale:3 -n 'redis'
tmux send-keys -t atria-tailscale:3 'sleep 5 && echo "Redis CLI: docker exec -it atria-redis-tailscale redis-cli"' C-m
tmux send-keys -t atria-tailscale:3 'echo "Monitor Redis: docker exec -it atria-redis-tailscale redis-cli monitor"' C-m
tmux send-keys -t atria-tailscale:3 'echo ""' C-m
tmux send-keys -t atria-tailscale:3 'echo "Waiting for Redis to start..."' C-m
tmux send-keys -t atria-tailscale:3 'sleep 10 && docker exec atria-redis-tailscale redis-cli INFO server | grep redis_version' C-m

# Split for Redis monitoring
tmux split-window -h -t atria-tailscale:3
tmux send-keys -t atria-tailscale:3.1 'sleep 12 && watch -n 2 "docker exec atria-redis-tailscale redis-cli INFO stats | grep -E \"keyspace|instantaneous|connected_clients\""' C-m

# Create a new window for shell access
tmux new-window -t atria-tailscale:4 -n 'shells'
tmux send-keys -t atria-tailscale:4 'echo "=== Container Shell Access ==="' C-m
tmux send-keys -t atria-tailscale:4 'echo "Backend 1: docker exec -it atria-backend-tailscale-1 /bin/sh"' C-m
tmux send-keys -t atria-tailscale:4 'echo "Backend 2: docker exec -it atria-backend-tailscale-2 /bin/sh"' C-m
tmux send-keys -t atria-tailscale:4 'echo "Redis: docker exec -it atria-redis-tailscale redis-cli"' C-m
tmux send-keys -t atria-tailscale:4 'echo "Frontend: docker exec -it atria-client-vite-tailscale /bin/sh"' C-m

# Split for database access
tmux split-window -h -t atria-tailscale:4
tmux send-keys -t atria-tailscale:4.1 'echo "DB shell: docker exec -it atria-db-tailscale psql -U ${POSTGRES_USER:-atria_user} -d ${POSTGRES_DB:-atria_dev}"' C-m

# Create a window for health checks
tmux new-window -t atria-tailscale:5 -n 'health'
tmux send-keys -t atria-tailscale:5 'echo "=== Health Check Endpoints ==="' C-m
tmux send-keys -t atria-tailscale:5 'echo "Basic: curl http://100.67.207.5/api/health"' C-m
tmux send-keys -t atria-tailscale:5 'echo "Detailed: curl http://100.67.207.5/api/health/detailed | jq"' C-m
tmux send-keys -t atria-tailscale:5 'echo "Redis: curl http://100.67.207.5/api/health/redis | jq"' C-m
tmux send-keys -t atria-tailscale:5 'echo ""' C-m
tmux send-keys -t atria-tailscale:5 'echo "Waiting for services to start..."' C-m
tmux send-keys -t atria-tailscale:5 'sleep 20 && curl -s http://100.67.207.5/api/health/detailed | jq' C-m

# Split for continuous health monitoring
tmux split-window -h -t atria-tailscale:5
tmux send-keys -t atria-tailscale:5.1 'sleep 25 && watch -n 5 "curl -s http://100.67.207.5/api/health/redis | jq .socketio_redis.stats"' C-m

# Switch back to the first window
tmux select-window -t atria-tailscale:0

# Print instructions
echo ""
echo -e "${GREEN}✅ Tailscale development environment started in tmux session 'atria-tailscale'${NC}"
echo ""
echo -e "${CYAN}📱 Mobile/Remote Access (via Tailscale):${NC}"
echo "  Frontend:          http://100.67.207.5:5173"
echo "  Backend (Traefik): http://100.67.207.5/api"
echo "  API Docs:          http://100.67.207.5/api/new-swagger"
echo "  Health Status:     http://100.67.207.5/api/health/detailed"
echo ""
echo -e "${BLUE}💻 Local Access:${NC}"
echo "  Frontend:          http://localhost:5173"
echo "  Backend (Traefik): http://localhost/api"
echo "  Traefik Dashboard: http://localhost:8080"
echo "  Avatar API:        http://localhost:5001"
echo ""
echo -e "${BLUE}🔍 Monitoring:${NC}"
echo "  Redis CLI:    docker exec -it atria-redis-tailscale redis-cli"
echo "  Redis Monitor: docker exec -it atria-redis-tailscale redis-cli monitor"
echo "  Backend 1 logs: docker logs -f atria-backend-tailscale-1"
echo "  Backend 2 logs: docker logs -f atria-backend-tailscale-2"
echo ""
echo -e "${BLUE}📺 Tmux windows:${NC}"
echo "  0: docker       - Docker compose output"
echo "  1: backends     - Backend instance logs (split)"
echo "  2: frontend+traefik - Frontend and Traefik logs"
echo "  3: redis        - Redis monitoring"
echo "  4: shells       - Container shell access"
echo "  5: health       - Health check monitoring"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo "  View session:    tmux attach -t atria-tailscale"
echo "  Switch windows:  Ctrl-b [0-5]"
echo "  Switch panes:    Ctrl-b arrow keys"
echo "  Detach:         Ctrl-b d"
echo "  Stop everything: ./stop-tailscale-dev-tmux.sh"
echo ""
echo -e "${CYAN}📱 Testing on Phone:${NC}"
echo "  1. Ensure your phone is connected to Tailscale"
echo "  2. Open browser to: http://100.67.207.5:5173"
echo "  3. Frontend will connect to API at: http://100.67.207.5/api"
echo ""
echo -e "${GREEN}Tip: The first backend instance will seed the database automatically.${NC}"
