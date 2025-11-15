#!/bin/bash

# Stop PRODUCTION PREVIEW environment

# Get the project root directory (two levels up from this script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

echo "🛑 Stopping production preview environment..."

# Stop docker compose
cd "$PROJECT_ROOT" && docker compose -f docker-compose.preview.yml down

# Kill the tmux session
tmux kill-session -t atria-preview 2>/dev/null

echo "✅ Production preview environment stopped"
