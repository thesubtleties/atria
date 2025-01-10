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
flask db init || true
flask db migrate
flask db upgrade

# Seeding (commented out for now)
# echo "Running seeds..."
# flask seed run
# echo "Seeding completed!"

echo "Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:5000 "api.wsgi:app"