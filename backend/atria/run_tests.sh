#!/bin/bash

# Script to run tests with PostgreSQL

set -e  # Exit on error

echo "🧪 Starting test environment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up test containers...${NC}"
    docker compose -f ../../docker-compose.test.yml down -v 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Start PostgreSQL and Redis for tests
echo -e "${YELLOW}🐘 Starting PostgreSQL test database...${NC}"
docker compose -f ../../docker-compose.test.yml up -d postgres-test redis-test

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec atria-postgres-test pg_isready -U test_user -d test_atria &>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    exit 1
fi

# Wait for Redis to be ready
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker exec capstone-redis-test-1 redis-cli ping &>/dev/null; then
        echo -e "${GREEN}✅ Redis is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${YELLOW}⚠️ Redis failed to start - tests will run without rate limiting${NC}"
fi

# Set up database and Redis environment
echo -e "${YELLOW}🔧 Setting up database...${NC}"
export DATABASE_URL="postgresql://test_user:test_pass@localhost:5433/test_atria"
export REDIS_URL="redis://localhost:6380/0"
export SQLALCHEMY_DATABASE_URI="postgresql://test_user:test_pass@localhost:5433/test_atria"
export TEST_DATABASE_URL="postgresql://test_user:test_pass@localhost:5433/test_atria"
export FLASK_APP="api.app:create_app"
export FLASK_ENV="testing"
export TESTING="true"

# Check if database needs initialization or migration
echo -e "${YELLOW}📊 Applying database migrations...${NC}"
flask db upgrade head 2>&1 | grep -E "Running|Current|Will assume" | tail -10

echo -e "${GREEN}✅ Database ready!${NC}"

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"

# Run pytest with options
if [ "$1" == "--coverage" ]; then
    # Full coverage report
    python -m pytest tests/ -v --cov=api --cov-report=term-missing --cov-report=html --cov-fail-under=30
elif [ "$1" == "--verbose" ]; then
    # Verbose output with all details
    shift
    python -m pytest "$@" -vv --tb=long
else
    # Clean, simple output by default
    if [ -n "$1" ]; then
        python -m pytest "$@"
    else
        python -m pytest tests/
    fi
fi

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
fi

exit $TEST_EXIT_CODE