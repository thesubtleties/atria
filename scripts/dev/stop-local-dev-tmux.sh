#!/bin/bash

# Stop LOCAL development environment

# Get the project root directory (two levels up from this script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

echo "Stopping LOCAL development environment..."

# Kill the tmux session
tmux kill-session -t atria-local 2>/dev/null

# Stop and remove containers
cd "$PROJECT_ROOT" && docker compose -f docker-compose.local-dev.yml down

echo "✅ LOCAL development environment stopped"