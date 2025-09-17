#!/bin/bash

# Stop Redis development environment and cleanup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Redis development environment...${NC}"

# Stop docker compose
echo "Stopping Docker containers..."
docker compose -f docker-compose.redis-dev.yml down

# Kill tmux session if it exists
if tmux has-session -t atria-redis 2>/dev/null; then
    echo "Killing tmux session 'atria-redis'..."
    tmux kill-session -t atria-redis
    echo -e "${GREEN}✅ Tmux session terminated${NC}"
else
    echo "Tmux session 'atria-redis' not found (already stopped)"
fi

# Optional: Clean up volumes (commented out by default to preserve data)
echo ""
echo -e "${YELLOW}Docker containers stopped.${NC}"
echo ""
echo "To remove volumes and start fresh next time, run:"
echo "  docker compose -f docker-compose.redis-dev.yml down -v"
echo ""
echo "To remove all Redis data:"
echo "  docker volume rm capstone_redis_data_dev"
echo ""
echo -e "${GREEN}✅ Redis development environment stopped${NC}"