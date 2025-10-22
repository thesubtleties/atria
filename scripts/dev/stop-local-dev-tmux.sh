#!/bin/bash

# Stop LOCAL development environment

echo "Stopping LOCAL development environment..."

# Kill the tmux session
tmux kill-session -t atria-local 2>/dev/null

# Stop and remove containers
docker compose -f docker-compose.local-dev.yml down

echo "✅ LOCAL development environment stopped"