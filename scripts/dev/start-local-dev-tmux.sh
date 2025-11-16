#!/bin/bash

# Start LOCAL development environment in tmux (for localhost access)

# Get the project root directory (two levels up from this script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Create a new tmux session named 'atria-local' or attach if exists
tmux new-session -d -s atria-local || tmux attach -t atria-local

# Rename the first window to 'docker'
tmux rename-window -t atria-local:0 'docker'

# Start docker compose with LOCAL config in the first pane
tmux send-keys -t atria-local:0 "cd '$PROJECT_ROOT' && docker compose -f docker-compose.local-dev.yml up" C-m

# Create a new window for logs
tmux new-window -t atria-local:1 -n 'logs'
tmux send-keys -t atria-local:1 "cd '$PROJECT_ROOT' && sleep 5 && docker compose -f docker-compose.local-dev.yml logs -f backend" C-m

# Split the logs window horizontally
tmux split-window -h -t atria-local:1
tmux send-keys -t atria-local:1.1 "cd '$PROJECT_ROOT' && sleep 5 && docker compose -f docker-compose.local-dev.yml logs -f frontend-vite" C-m

# Create a new window for shell access
tmux new-window -t atria-local:2 -n 'shell'
tmux send-keys -t atria-local:2 'echo "Container shells - use docker exec -it <container> /bin/sh"' C-m

# Split the shell window for backend and frontend access
tmux split-window -h -t atria-local:2
tmux send-keys -t atria-local:2.0 'echo "Backend shell: docker exec -it atria-api-dev /bin/sh"' C-m
tmux send-keys -t atria-local:2.1 'echo "Frontend shell: docker exec -it atria-client-vite-dev /bin/sh"' C-m

# Create a window for database access
tmux new-window -t atria-local:3 -n 'database'
tmux send-keys -t atria-local:3 'echo "DB shell: docker exec -it atria-db-dev psql -U $POSTGRES_USER -d $POSTGRES_DB"' C-m

# Switch back to the first window
tmux select-window -t atria-local:0

# Don't attach - just print instructions
echo "✅ LOCAL development environment started in tmux session 'atria-local'"
echo ""
echo "📍 Access points:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:5000"
echo "  API Docs: http://localhost:5000/new-swagger"
echo "  Avatar API: http://localhost:5001"
echo ""
echo "To view the session: tmux attach -t atria-local"
echo "To detach later: Ctrl-b then d"
echo "To stop everything: ./stop-local-dev-tmux.sh"