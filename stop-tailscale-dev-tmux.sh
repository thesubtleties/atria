#!/bin/bash

# Stop Tailscale development environment and cleanup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Tailscale development environment...${NC}"

# Stop docker compose
echo "Stopping Docker containers..."
docker compose -f docker-compose.tailscale-dev.yml down

# Kill tmux session if it exists
if tmux has-session -t atria-tailscale 2>/dev/null; then
    echo "Killing tmux session 'atria-tailscale'..."
    tmux kill-session -t atria-tailscale
    echo -e "${GREEN}✅ Tmux session terminated${NC}"
else
    echo "Tmux session 'atria-tailscale' not found (already stopped)"
fi

# Optional: Clean up volumes (commented out by default to preserve data)
echo ""
echo -e "${YELLOW}Docker containers stopped.${NC}"
echo ""
echo "To remove volumes and start fresh next time, run:"
echo "  docker compose -f docker-compose.tailscale-dev.yml down -v"
echo ""
echo "To remove all Tailscale environment data:"
echo "  docker volume rm capstone_redis_data_tailscale capstone_postgres_data_tailscale"
echo ""
echo -e "${GREEN}✅ Tailscale development environment stopped${NC}"
