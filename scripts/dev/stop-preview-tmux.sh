#!/bin/bash

# Stop PRODUCTION PREVIEW environment

echo "🛑 Stopping production preview environment..."

# Stop docker compose
docker compose -f docker-compose.preview.yml down

# Kill the tmux session
tmux kill-session -t atria-preview 2>/dev/null

echo "✅ Production preview environment stopped"
