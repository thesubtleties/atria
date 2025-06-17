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

# Initialize database with Flask-Migrate
echo "[$(date)] Setting up database schema..."
# Always start fresh with migrations in the container
rm -rf migrations
flask db init
flask db migrate -m "Initial migration $(date +%Y%m%d_%H%M%S)"
flask db upgrade

# Add optional seeding step
if [ "${SEED_DB:-true}" = "true" ]; then
    echo "[$(date)] Seeding database..."
    PYTHONPATH=/app python -m seeders.seed_db || { echo "[$(date)] ERROR: Seeding failed"; exit 1; }
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
        print(f"[$(date)] Found tables: {tables}")
        
        # Additional verification
        for table in tables:
            columns = inspector.get_columns(table)
            print(f"[$(date)] Table {table} columns: {[col['name'] for col in columns]}")
            
except Exception as e:
    print(f"[$(date)] ERROR during verification: {str(e)}", file=sys.stderr)
    sys.exit(1)
END


echo "[$(date)] Starting Gunicorn server..."
exec python -u -m gunicorn "api.wsgi:app" \
    --bind 0.0.0.0:5000 \
    --workers ${GUNICORN_WORKERS:-4} \
    --threads 2 \
    --log-level ${LOG_LEVEL:-warning} \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --timeout 120 \
    --access-logformat '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s'

