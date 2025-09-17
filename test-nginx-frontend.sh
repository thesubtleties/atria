#!/bin/bash

# Test script for nginx frontend serving

echo "=========================================="
echo "Testing Nginx Frontend Server"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Build the frontend image locally
echo "Building frontend with nginx..."
docker build -f deploy/Dockerfile.frontend.prod -t atria-frontend-nginx:test .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Run the container
echo "Starting nginx container..."
docker run -d --name test-nginx-frontend -p 8888:80 atria-frontend-nginx:test

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Container started${NC}"
echo ""

# Wait for startup
sleep 3

# Test endpoints
echo "Testing endpoints:"
echo "------------------------"

# Test health endpoint
echo -n "Health check: "
health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/health)
if [ "$health" = "200" ]; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $health)${NC}"
fi

# Test main page
echo -n "Main page: "
main=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/)
if [ "$main" = "200" ]; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $main)${NC}"
fi

# Test cache headers
echo ""
echo "Cache Headers Test:"
echo "------------------------"
curl -sI http://localhost:8888/ | grep -i cache-control

echo ""
echo "Compression Test:"
echo "------------------------"
curl -sI -H "Accept-Encoding: gzip" http://localhost:8888/ | grep -i encoding

echo ""
echo "=========================================="
echo -e "${GREEN}Frontend is accessible at: http://localhost:8888${NC}"
echo -e "${YELLOW}To stop: docker stop test-nginx-frontend && docker rm test-nginx-frontend${NC}"
echo "=========================================="