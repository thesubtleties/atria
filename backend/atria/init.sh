#!/bin/sh

# Exit on any error
set -e

echo "Starting initialization script..."

# Wait for database
echo "Waiting for postgres..."
while ! nc -z atria-db 5432; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL started successfully!"

# Initialize database
echo "Initializing database..."

# Remove existing migrations if they exist
rm -rf migrations/
flask db init

# Create and apply migrations
echo "Creating migrations..."
flask db migrate -m "Initial migration"

echo "Applying migrations..."
flask db upgrade

# Verify database setup
echo "Verifying database setup..."
python << END
from api.app import create_app
from api.extensions import db
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"Found tables: {tables}")
END

echo "Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:5000 "api.wsgi:app"