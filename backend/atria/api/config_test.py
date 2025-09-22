"""Test configuration - uses SQLite in memory"""

from datetime import timedelta

# Testing flags
TESTING = True
DEBUG = True
SECRET_KEY = "test-secret-key"

# Use PostgreSQL for tests (matches production)
import os
SQLALCHEMY_DATABASE_URI = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://test_user:test_pass@localhost:5433/test_atria"
)
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_ECHO = False  # Set to True to debug queries

# JWT settings
JWT_SECRET_KEY = "test-jwt-secret-key"
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
JWT_BLOCKLIST_ENABLED = False  # Disable for tests

# JWT Cookie settings
JWT_TOKEN_LOCATION = ["cookies", "headers"]
JWT_COOKIE_SECURE = False
JWT_ACCESS_COOKIE_PATH = "/api"
JWT_REFRESH_COOKIE_PATH = "/api/auth/refresh"
JWT_COOKIE_CSRF_PROTECT = False
JWT_COOKIE_SAMESITE = "Lax"

# Flask-SMOREST configs
API_TITLE = "Atria API Test"
API_VERSION = "1.0.0"
OPENAPI_VERSION = "3.0.2"
OPENAPI_JSON_PATH = "api-spec.json"
OPENAPI_URL_PREFIX = "/"
OPENAPI_SWAGGER_UI_PATH = None  # Disable Swagger in tests
OPENAPI_SWAGGER_UI_URL = None

# Disable external services for tests
REDIS_URL = None
SOCKETIO_REDIS_URL = None
SMTP2GO_API_KEY = None
MAIL_DEFAULT_SENDER = "test@test.com"
FRONTEND_URL = "http://localhost:3000"

# Disable MinIO for tests
MINIO_ENDPOINT = None
MINIO_ACCESS_KEY = None
MINIO_SECRET_KEY = None

# Socket.IO Configuration
SOCKETIO_ASYNC_MODE = "threading"  # Use threading for tests
SOCKETIO_LOGGER = False
SOCKETIO_ENGINEIO_LOGGER = False

# Cache Configuration
CACHE_TYPE = "simple"
CACHE_DEFAULT_TIMEOUT = 300

# Celery disabled for tests
USE_CELERY = False
CELERY_BROKER_URL = None
CELERY_RESULT_BACKEND = None