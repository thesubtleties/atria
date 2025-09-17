#!/bin/sh

# Exit on any error
set -e

echo "[$(date)] Starting initialization script..."

# Wait for database with timeout
MAX_TRIES=30
TRIES=0
echo "[$(date)] Waiting for postgres..."
while ! nc -z ${DB_HOST:-db} 5432; do
    echo "[$(date)] Postgres is unavailable - sleeping"
    TRIES=$((TRIES+1))
    if [ $TRIES -gt $MAX_TRIES ]; then
        echo "[$(date)] ERROR: Postgres did not become available in time"
        exit 1
    fi
    sleep 1
done
echo "[$(date)] PostgreSQL started successfully!"

# Initialize database with better error handling
echo "[$(date)] Initializing database..."

# Check if alembic_version table exists (indicates migrations have been run)
ALEMBIC_EXISTS=$(python << END
from api.app import create_app
from api.extensions import db
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print("yes" if "alembic_version" in tables else "no")
END
)

echo "[$(date)] Alembic version table exists: $ALEMBIC_EXISTS"

# Handle migrations based on whether database is already initialized
if [ "$ALEMBIC_EXISTS" = "yes" ]; then
    echo "[$(date)] Database already initialized, checking for pending migrations..."
    
    # Check if we need to run migrations
    flask db upgrade || {
        echo "[$(date)] Migration failed. Database may be out of sync."
        echo "[$(date)] Attempting to stamp current revision..."
        
        # Get the current migration head
        CURRENT_HEAD=$(flask db heads | head -n1)
        echo "[$(date)] Current migration head: $CURRENT_HEAD"
        
        # Stamp the database with current migration
        flask db stamp $CURRENT_HEAD
        
        # Try upgrade again
        flask db upgrade || { 
            echo "[$(date)] ERROR: Could not apply migrations"
            exit 1
        }
    }
else
    echo "[$(date)] Database not initialized, setting up from scratch..."
    
    # Only initialize migrations if the directory doesn't exist or is empty
    if [ ! -d "migrations" ] || [ -z "$(ls -A migrations 2>/dev/null)" ]; then
        echo "[$(date)] Initializing migrations..."
        flask db init
    fi
    
    # Check if there are existing migration files
    if [ -d "migrations/versions" ] && [ "$(ls -A migrations/versions/*.py 2>/dev/null | grep -v __pycache__ | wc -l)" -gt 0 ]; then
        echo "[$(date)] Found existing migrations, applying them..."
        flask db upgrade
    else
        echo "[$(date)] No existing migrations found, creating initial migration..."
        flask db migrate -m "Initial migration $(date +%Y%m%d_%H%M%S)"
        flask db upgrade
    fi
fi

# Add optional seeding step
if [ "${SEED_DB:-false}" = "true" ]; then
    echo "[$(date)] Checking if database needs seeding..."
    
    # Check if database has data
    HAS_DATA=$(python << END
from api.app import create_app
from api.extensions import db
from api.models import User

app = create_app()
with app.app_context():
    user_count = User.query.count()
    print("yes" if user_count > 0 else "no")
END
)
    # Updated to use comprehensive seed data.
    if [ "$HAS_DATA" = "yes" ]; then
        echo "[$(date)] Database already has data, skipping seeding"
    else
        echo "[$(date)] Seeding database with comprehensive data (75+ users)..."
        PYTHONPATH=/app python -m seeders.comprehensive_seed_db || { echo "[$(date)] ERROR: Seeding failed"; exit 1; }
    fi
else
    echo "[$(date)] Skipping database seeding (SEED_DB=false)"
fi

# Verify database setup with more detailed output
echo "[$(date)] Verifying database setup..."
python << END
from api.app import create_app
from api.extensions import db
from sqlalchemy import inspect
import sys

try:
    app = create_app()
    with app.app_context():
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"[$(date)] Found {len(tables)} tables")
        
        # Check critical tables
        critical_tables = ['users', 'organizations', 'events', 'sessions']
        missing_tables = [t for t in critical_tables if t not in tables]
        
        if missing_tables:
            print(f"[$(date)] ERROR: Missing critical tables: {missing_tables}", file=sys.stderr)
            sys.exit(1)
        else:
            print(f"[$(date)] All critical tables present")
            
except Exception as e:
    print(f"[$(date)] ERROR during verification: {str(e)}", file=sys.stderr)
    sys.exit(1)
END


# Determine worker count based on Redis availability
if [ -n "$REDIS_URL" ]; then
    WORKERS=${GUNICORN_WORKERS:-4}
    echo "[$(date)] 🔄 Redis detected - using $WORKERS workers for clustering"
else
    WORKERS=1
    echo "[$(date)] ⚠️ No Redis - using single worker (no clustering)"
fi

echo "[$(date)] Starting Gunicorn server with $WORKERS workers..."
exec python -u -m gunicorn "api.wsgi:app" \
    --worker-class eventlet \
    --bind 0.0.0.0:5000 \
    --workers $WORKERS \
    --worker-connections 1000 \
    --log-level ${LOG_LEVEL:-warning} \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --timeout 120 \
    --access-logformat '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s'