#!/bin/bash

# Start PRODUCTION PREVIEW environment in tmux
# This builds the frontend with pre-rendering and serves with nginx

# Get the project root directory (two levels up from this script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

echo "🏗️  Building frontend with pre-rendering..."
cd "$PROJECT_ROOT/frontend" && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built successfully"
echo ""

# Kill existing session if it exists
tmux kill-session -t atria-preview 2>/dev/null || true

# Create a new tmux session named 'atria-preview'
tmux new-session -d -s atria-preview

# Rename the first window to 'docker'
tmux rename-window -t atria-preview:0 'docker'

# Start docker compose with PREVIEW config in the first pane
tmux send-keys -t atria-preview:0 "cd '$PROJECT_ROOT' && docker compose -f docker-compose.preview.yml up --build" C-m

# Create a new window for logs
tmux new-window -t atria-preview:1 -n 'logs'
tmux send-keys -t atria-preview:1 "cd '$PROJECT_ROOT' && sleep 5 && docker compose -f docker-compose.preview.yml logs -f backend" C-m

# Split the logs window horizontally
tmux split-window -h -t atria-preview:1
tmux send-keys -t atria-preview:1.1 "cd '$PROJECT_ROOT' && sleep 5 && docker compose -f docker-compose.preview.yml logs -f frontend" C-m

# Create a new window for shell access
tmux new-window -t atria-preview:2 -n 'shell'
tmux send-keys -t atria-preview:2 'echo "Container shells - use docker exec -it <container> /bin/sh"' C-m

# Split the shell window for backend and frontend access
tmux split-window -h -t atria-preview:2
tmux send-keys -t atria-preview:2.0 'echo "Backend shell: docker exec -it atria-api-preview /bin/sh"' C-m
tmux send-keys -t atria-preview:2.1 'echo "Frontend shell: docker exec -it atria-client-preview /bin/sh"' C-m

# Create a window for database access
tmux new-window -t atria-preview:3 -n 'database'
tmux send-keys -t atria-preview:3 'echo "DB shell: docker exec -it atria-db-preview psql -U $POSTGRES_USER -d $POSTGRES_DB"' C-m

# Switch back to the first window
tmux select-window -t atria-preview:0

# Don't attach - just print instructions
echo ""
echo "✅ PRODUCTION PREVIEW environment started in tmux session 'atria-preview'"
echo ""
echo "📍 Access points:"
echo "  Frontend (nginx): http://localhost:8080"
echo "  Backend API: http://localhost:5000"
echo "  API Docs: http://localhost:5000/new-swagger"
echo ""
echo "🎯 This environment:"
echo "  • Serves pre-rendered HTML with nginx"
echo "  • Includes compression, HTTP/2, security headers"
echo "  • Production-like performance"
echo "  • No hot reload (rebuild to see changes)"
echo ""
echo "To view the session: tmux attach -t atria-preview"
echo "To detach later: Ctrl-b then d"
echo "To stop everything: ./stop-preview-tmux.sh"
