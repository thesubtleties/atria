#!/bin/bash
# Export database schema to DBML format for visualization in ChartDB

set -e  # Exit on error

# Configuration
DB_CONTAINER="atria-db-dev"
DB_USER="dev_user"
DB_NAME="atria_dev"

echo "🔍 Checking database container..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if the container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Container '${DB_CONTAINER}' not found."
    echo ""
    echo "Available containers:"
    docker ps -a --format "  - {{.Names}}" | grep -E "atria|postgres" || echo "  (No Atria/PostgreSQL containers found)"
    echo ""
    echo "💡 If your database container has a different name, edit this script and update DB_CONTAINER variable"
    exit 1
fi

# Check if the container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Container '${DB_CONTAINER}' exists but is not running."
    echo ""
    echo "Start your development environment first:"
    echo "  ./dev-environment-chooser.sh"
    exit 1
fi

echo "✅ Container '${DB_CONTAINER}' is running"
echo ""

echo "🔍 Exporting PostgreSQL schema to JSON..."
docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -A < scripts/database/schema-query.sql > database-schema.json

if [ $? -eq 0 ]; then
    echo "✅ JSON schema exported to database-schema.json"
else
    echo "❌ Failed to export schema"
    echo ""
    echo "💡 Check if database credentials are correct:"
    echo "   DB_USER=${DB_USER}"
    echo "   DB_NAME=${DB_NAME}"
    exit 1
fi

echo ""
echo "🔄 Converting JSON to DBML format..."
python3 scripts/database/json-to-dbml.py database-schema.json database-schema.dbml

if [ $? -eq 0 ]; then
    echo "✅ DBML schema exported to database-schema.dbml"
else
    echo "❌ Failed to convert to DBML"
    echo ""
    echo "💡 Make sure Python 3 is installed"
    exit 1
fi

echo ""
echo "🎉 Done! You can now import database-schema.dbml into:"
echo "   • ChartDB: https://chartdb.io"
echo "   • dbdiagram.io: https://dbdiagram.io"
echo ""
echo "📊 Schema Summary:"
echo "   Tables: $(jq '.tables | length' database-schema.json 2>/dev/null || echo 'N/A')"
echo "   Columns: $(jq '.columns | length' database-schema.json 2>/dev/null || echo 'N/A')"
echo "   Foreign Keys: $(jq '.fk_info | length' database-schema.json 2>/dev/null || echo 'N/A')"
