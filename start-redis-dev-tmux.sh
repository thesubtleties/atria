#!/bin/bash

# Start Redis-enabled development environment with Traefik in tmux

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Redis development environment with Traefik...${NC}"

# Create a new tmux session named 'atria-redis' or attach if exists
tmux has-session -t atria-redis 2>/dev/null
if [ $? != 0 ]; then
    tmux new-session -d -s atria-redis
else
    echo -e "${YELLOW}Session 'atria-redis' already exists. Killing old session...${NC}"
    tmux kill-session -t atria-redis
    sleep 1
    tmux new-session -d -s atria-redis
fi

# Rename the first window to 'docker'
tmux rename-window -t atria-redis:0 'docker'

# Start docker compose with Redis config in the first pane
tmux send-keys -t atria-redis:0 'docker compose -f docker-compose.redis-dev.yml up' C-m

# Create a new window for backend logs (split for both instances)
tmux new-window -t atria-redis:1 -n 'backends'
tmux send-keys -t atria-redis:1 'sleep 10 && docker compose -f docker-compose.redis-dev.yml logs -f backend-1' C-m

# Split for backend-2 logs
tmux split-window -h -t atria-redis:1
tmux send-keys -t atria-redis:1.1 'sleep 10 && docker compose -f docker-compose.redis-dev.yml logs -f backend-2' C-m

# Create a new window for frontend and traefik logs
tmux new-window -t atria-redis:2 -n 'frontend+traefik'
tmux send-keys -t atria-redis:2 'sleep 10 && docker compose -f docker-compose.redis-dev.yml logs -f frontend-vite' C-m

# Split for Traefik logs
tmux split-window -h -t atria-redis:2
tmux send-keys -t atria-redis:2.1 'sleep 10 && docker compose -f docker-compose.redis-dev.yml logs -f traefik' C-m

# Create a new window for Redis monitoring
tmux new-window -t atria-redis:3 -n 'redis'
tmux send-keys -t atria-redis:3 'sleep 5 && echo "Redis CLI: docker exec -it atria-redis-dev redis-cli"' C-m
tmux send-keys -t atria-redis:3 'echo "Monitor Redis: docker exec -it atria-redis-dev redis-cli monitor"' C-m
tmux send-keys -t atria-redis:3 'echo ""' C-m
tmux send-keys -t atria-redis:3 'echo "Waiting for Redis to start..."' C-m
tmux send-keys -t atria-redis:3 'sleep 10 && docker exec atria-redis-dev redis-cli INFO server | grep redis_version' C-m

# Split for Redis monitoring
tmux split-window -h -t atria-redis:3
tmux send-keys -t atria-redis:3.1 'sleep 12 && watch -n 2 "docker exec atria-redis-dev redis-cli INFO stats | grep -E \"keyspace|instantaneous|connected_clients\""' C-m

# Create a new window for shell access
tmux new-window -t atria-redis:4 -n 'shells'
tmux send-keys -t atria-redis:4 'echo "=== Container Shell Access ==="' C-m
tmux send-keys -t atria-redis:4 'echo "Backend 1: docker exec -it atria-backend-1 /bin/sh"' C-m
tmux send-keys -t atria-redis:4 'echo "Backend 2: docker exec -it atria-backend-2 /bin/sh"' C-m
tmux send-keys -t atria-redis:4 'echo "Redis: docker exec -it atria-redis-dev redis-cli"' C-m
tmux send-keys -t atria-redis:4 'echo "Frontend: docker exec -it atria-client-vite-dev /bin/sh"' C-m

# Split for database access
tmux split-window -h -t atria-redis:4
tmux send-keys -t atria-redis:4.1 'echo "DB shell: docker exec -it atria-db-dev psql -U ${POSTGRES_USER:-atria_user} -d ${POSTGRES_DB:-atria_dev}"' C-m

# Create a window for health checks
tmux new-window -t atria-redis:5 -n 'health'
tmux send-keys -t atria-redis:5 'echo "=== Health Check Endpoints ==="' C-m
tmux send-keys -t atria-redis:5 'echo "Basic: curl http://localhost/api/health"' C-m
tmux send-keys -t atria-redis:5 'echo "Detailed: curl http://localhost/api/health/detailed | jq"' C-m
tmux send-keys -t atria-redis:5 'echo "Redis: curl http://localhost/api/health/redis | jq"' C-m
tmux send-keys -t atria-redis:5 'echo ""' C-m
tmux send-keys -t atria-redis:5 'echo "Waiting for services to start..."' C-m
tmux send-keys -t atria-redis:5 'sleep 20 && curl -s http://localhost/api/health/detailed | jq' C-m

# Split for continuous health monitoring
tmux split-window -h -t atria-redis:5
tmux send-keys -t atria-redis:5.1 'sleep 25 && watch -n 5 "curl -s http://localhost/api/health/redis | jq .socketio_redis.stats"' C-m

# Switch back to the first window
tmux select-window -t atria-redis:0

# Print instructions
echo ""
echo -e "${GREEN}✅ Redis development environment started in tmux session 'atria-redis'${NC}"
echo ""
echo -e "${BLUE}📍 Access points:${NC}"
echo "  Frontend:          http://localhost:5173"
echo "  Backend (Traefik): http://localhost/api"
echo "  Traefik Dashboard: http://localhost:8080"
echo "  API Docs:          http://localhost/api/new-swagger"
echo "  Health Status:     http://localhost/api/health/detailed"
echo ""
echo -e "${BLUE}🔍 Monitoring:${NC}"
echo "  Redis CLI:    docker exec -it atria-redis-dev redis-cli"
echo "  Redis Monitor: docker exec -it atria-redis-dev redis-cli monitor"
echo "  Backend 1 logs: docker logs -f atria-backend-1"
echo "  Backend 2 logs: docker logs -f atria-backend-2"
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
echo "  View session:    tmux attach -t atria-redis"
echo "  Switch windows:  Ctrl-b [0-5]"
echo "  Switch panes:    Ctrl-b arrow keys"
echo "  Detach:         Ctrl-b d"
echo "  Stop everything: ./stop-redis-dev-tmux.sh"
echo ""
echo -e "${GREEN}Tip: The first backend instance will seed the database automatically.${NC}"