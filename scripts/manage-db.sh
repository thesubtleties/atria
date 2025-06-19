#!/bin/bash

# Database management script for Atria

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENV=${ENV:-development}

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get docker-compose file based on environment
get_compose_file() {
    if [ "$ENV" = "production" ]; then
        echo "docker-compose.production.yml"
    else
        echo "docker-compose.development.yml"
    fi
}

# Function to check if containers are running
check_containers() {
    local compose_file=$(get_compose_file)
    if docker-compose -f $compose_file ps | grep -q "atria-db"; then
        return 0
    else
        return 1
    fi
}

# Function to reset database
reset_db() {
    local compose_file=$(get_compose_file)
    
    print_warn "This will completely reset the database. All data will be lost!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Operation cancelled"
        exit 0
    fi
    
    print_info "Stopping containers..."
    docker-compose -f $compose_file down
    
    print_info "Removing database volume..."
    if [ "$ENV" = "production" ]; then
        docker volume rm atria_postgres_data_prod 2>/dev/null || true
    else
        docker volume rm atria_postgres_data_dev 2>/dev/null || true
    fi
    
    print_info "Database reset complete"
}

# Function to start with fresh database and seeding
fresh_start() {
    local compose_file=$(get_compose_file)
    
    print_info "Starting fresh with seeded database..."
    
    # Set SEED_DB=true for this run
    export SEED_DB=true
    
    print_info "Starting containers with SEED_DB=true..."
    docker-compose -f $compose_file up -d
    
    print_info "Waiting for backend to be healthy..."
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f $compose_file exec backend curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
            print_info "Backend is healthy!"
            break
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Backend failed to become healthy"
        exit 1
    fi
    
    print_info "Fresh start complete!"
}

# Function to check database status
check_status() {
    local compose_file=$(get_compose_file)
    
    if ! check_containers; then
        print_warn "Containers are not running"
        return
    fi
    
    print_info "Checking database status..."
    
    docker-compose -f $compose_file exec backend python << 'EOF'
from api.app import create_app
from api.extensions import db
from api.models import User, Organization, Event
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    
    print(f"\nDatabase Tables: {len(tables)}")
    print("-" * 40)
    
    # Check for alembic version
    if "alembic_version" in tables:
        result = db.session.execute(db.text("SELECT version_num FROM alembic_version"))
        version = result.scalar()
        print(f"Migration Version: {version}")
    else:
        print("Migration Version: Not initialized")
    
    print(f"\nData Summary:")
    print(f"  Users: {User.query.count()}")
    print(f"  Organizations: {Organization.query.count()}")
    print(f"  Events: {Event.query.count()}")
EOF
}

# Function to run migrations
run_migrations() {
    local compose_file=$(get_compose_file)
    
    if ! check_containers; then
        print_error "Containers are not running"
        exit 1
    fi
    
    print_info "Running database migrations..."
    
    docker-compose -f $compose_file exec backend flask db upgrade
    
    print_info "Migrations complete"
}

# Main menu
show_usage() {
    echo "Atria Database Management"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status      Check database status"
    echo "  reset       Reset database (removes all data)"
    echo "  fresh       Reset and start with seeded data"
    echo "  migrate     Run pending migrations"
    echo "  help        Show this help message"
    echo ""
    echo "Environment:"
    echo "  ENV=${ENV} (use ENV=production for production commands)"
}

# Parse command
case "${1:-help}" in
    status)
        check_status
        ;;
    reset)
        reset_db
        ;;
    fresh)
        reset_db
        fresh_start
        ;;
    migrate)
        run_migrations
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac