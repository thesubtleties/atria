#!/bin/bash

# Test script for Redis integration with Atria
# This validates that Redis, Traefik, and multi-instance Socket.IO work correctly

set -e

echo "=========================================="
echo "Atria Redis Integration Test Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites checked${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3

    echo -n "Testing $description... "

    response=$(curl -s -o /dev/null -w "%{http_code}" $url)

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}✗ (Expected $expected_status, got $response)${NC}"
        return 1
    fi
}

# Function to check Redis
check_redis() {
    echo -n "Checking Redis connection... "
    if docker exec atria-redis-dev redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is running${NC}"

        # Get Redis info
        clients=$(docker exec atria-redis-dev redis-cli INFO clients | grep connected_clients | cut -d: -f2 | tr -d '\r')
        memory=$(docker exec atria-redis-dev redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        echo "  - Connected clients: $clients"
        echo "  - Memory used: $memory"
    else
        echo -e "${RED}✗ Redis is not responding${NC}"
        return 1
    fi
}

# Function to check Traefik dashboard
check_traefik() {
    echo -n "Checking Traefik dashboard... "
    if curl -s http://localhost:8080/api/overview > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Traefik dashboard accessible at http://localhost:8080${NC}"
    else
        echo -e "${YELLOW}⚠ Traefik dashboard not accessible${NC}"
    fi
}

# Start the services
echo "Starting services with Redis and Traefik..."
echo "=========================================="
docker-compose -f docker-compose.redis-dev.yml up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "=========================================="
echo "Running Integration Tests"
echo "=========================================="
echo ""

# 1. Test Traefik
check_traefik
echo ""

# 2. Test Redis
check_redis
echo ""

# 3. Test Health Endpoints
echo "Testing Health Endpoints:"
echo "-------------------------"
test_endpoint "http://localhost/api/health" "200" "Basic health check"
test_endpoint "http://localhost/api/health/ready" "200" "Readiness check"
test_endpoint "http://localhost/api/health/detailed" "200" "Detailed health check"
test_endpoint "http://localhost/api/health/redis" "200" "Redis health check"

echo ""

# 4. Check load balancing
echo "Testing Load Balancing:"
echo "----------------------"
echo "Making multiple requests to check sticky sessions..."

# Make requests and check for cookie
for i in {1..5}; do
    echo -n "Request $i: "
    response=$(curl -s -I http://localhost/api/health | grep -i "set-cookie: atria-affinity" || echo "")
    if [ -n "$response" ]; then
        echo -e "${GREEN}✓ Sticky session cookie set${NC}"
        break
    else
        echo "No cookie yet..."
    fi
done

echo ""

# 5. Check backend instances
echo "Checking Backend Instances:"
echo "--------------------------"
backend1_logs=$(docker logs atria-backend-1 2>&1 | grep -c "Redis" || echo "0")
backend2_logs=$(docker logs atria-backend-2 2>&1 | grep -c "Redis" || echo "0")

if [ "$backend1_logs" -gt 0 ]; then
    echo -e "${GREEN}✓ Backend 1 connected to Redis${NC}"
else
    echo -e "${YELLOW}⚠ Backend 1 may not be using Redis${NC}"
fi

if [ "$backend2_logs" -gt 0 ]; then
    echo -e "${GREEN}✓ Backend 2 connected to Redis${NC}"
else
    echo -e "${YELLOW}⚠ Backend 2 may not be using Redis${NC}"
fi

echo ""

# 6. Test Socket.IO Redis channels
echo "Checking Socket.IO Redis Integration:"
echo "-------------------------------------"
socketio_keys=$(docker exec atria-redis-dev redis-cli KEYS "socketio:*" | wc -l)
echo "Socket.IO channels in Redis: $socketio_keys"

echo ""

# 7. Display detailed health info
echo "=========================================="
echo "Detailed Health Status:"
echo "=========================================="
echo ""
curl -s http://localhost/api/health/detailed | python3 -m json.tool 2>/dev/null || curl -s http://localhost/api/health/detailed

echo ""
echo ""
echo "=========================================="
echo "Test Summary:"
echo "=========================================="

# Summary
all_passed=true

# Check critical services
if docker exec atria-redis-dev redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis: Running${NC}"
else
    echo -e "${RED}✗ Redis: Not running${NC}"
    all_passed=false
fi

if curl -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend: Accessible through Traefik${NC}"
else
    echo -e "${RED}✗ Backend: Not accessible${NC}"
    all_passed=false
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend: Running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend: May still be starting${NC}"
fi

echo ""

if [ "$all_passed" = true ]; then
    echo -e "${GREEN}=========================================="
    echo "✅ All critical tests passed!"
    echo "==========================================${NC}"
    echo ""
    echo "You can now:"
    echo "  - View Traefik dashboard: http://localhost:8080"
    echo "  - Access the app: http://localhost:5173"
    echo "  - Monitor Redis: docker exec -it atria-redis-dev redis-cli monitor"
    echo "  - View logs: docker-compose -f docker-compose.redis-dev.yml logs -f"
    echo "  - Stop services: docker-compose -f docker-compose.redis-dev.yml down"
else
    echo -e "${RED}=========================================="
    echo "❌ Some tests failed. Check the logs:"
    echo "==========================================${NC}"
    echo ""
    echo "  docker-compose -f docker-compose.redis-dev.yml logs"
fi

echo ""