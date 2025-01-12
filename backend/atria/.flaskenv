# Flask settings

FLASK_ENV=development
FLASK_APP=api.wsgi:app

# Security

SECRET_KEY=dkjfkldjlkjk
JWT_SECRET_KEY=another-super-secret-key-change-in-prod # Add this for JWT

# Database

SQLALCHEMY_DATABASE_URI=postgresql://user:password@db:5432/atria

# Optional: Add these if you want different token expiry times

JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000
