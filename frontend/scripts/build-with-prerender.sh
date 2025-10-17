#!/bin/bash

# Build with pre-rendering script
#
# This script:
# 1. Runs the Vite build
# 2. Starts a preview server
# 3. Runs the pre-render script
# 4. Cleans up

set -e  # Exit on any error

echo "📦 Building frontend..."
npx vite build

echo ""
echo "🌐 Starting preview server..."

# Start preview server in background
npx vite preview --port 4173 --strictPort &
PREVIEW_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for preview server to start..."
sleep 3

# Check if server is running
if ! curl -s http://localhost:4173 > /dev/null; then
  echo "❌ Preview server failed to start"
  kill $PREVIEW_PID 2>/dev/null || true
  exit 1
fi

echo "✅ Preview server running on http://localhost:4173"
echo ""

# Run pre-render script
echo "🎬 Running pre-render..."
node scripts/prerender.mjs

# Cleanup: Kill the preview server
echo "🧹 Cleaning up preview server..."
kill $PREVIEW_PID 2>/dev/null || true

echo "✨ Build complete with pre-rendered HTML!"
echo ""
