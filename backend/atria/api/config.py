"""Default configuration
Use env var to override
"""

import os
from datetime import timedelta
from api.models import TokenBlocklist

ENV = os.getenv("FLASK_ENV", "development")
DEBUG = ENV == "development"
SECRET_KEY = os.getenv("SECRET_KEY", "changeme")

# Database settings
SQLALCHEMY_DATABASE_URI = os.getenv("SQLALCHEMY_DATABASE_URI")
SQLALCHEMY_TRACK_MODIFICATIONS = False

# JWT settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key")
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
JWT_BLOCKLIST_ENABLED = True
JWT_BLOCKLIST_TOKEN_CHECKS = ["access", "refresh"]

# JWT Cookie settings
JWT_TOKEN_LOCATION = ["cookies", "headers"]  # Check cookies first, then headers
JWT_COOKIE_SECURE = ENV == "production"  # Only use secure in production
JWT_ACCESS_COOKIE_PATH = "/api"
JWT_REFRESH_COOKIE_PATH = "/api/auth/refresh"
JWT_COOKIE_CSRF_PROTECT = False  # We'll use SameSite instead
JWT_COOKIE_SAMESITE = "Lax"

# Flask-SMOREST configs
API_TITLE = "Atria API"
API_VERSION = "1.0.0"
OPENAPI_VERSION = "3.0.2"
OPENAPI_JSON_PATH = "api-spec.json"
OPENAPI_URL_PREFIX = "/"
OPENAPI_SWAGGER_UI_PATH = "/new-swagger"
OPENAPI_SWAGGER_UI_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

# API Spec Options for flask-smorest
API_SPEC_OPTIONS = {
    "security": [{"jwt": []}],
    "components": {
        "securitySchemes": {
            "jwt": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "Enter your JWT token in the format: Bearer <JWT>",
            }
        }
    },
}

# APISPEC configs (old system)
APISPEC_SWAGGER_URL = "/old-swagger.json"
APISPEC_SWAGGER_UI_URL = "/old-swagger"
APISPEC_SPEC = {
    "info": {
        "title": "Atria API",
        "version": "1.0.0",
        "description": "API documentation for Atria",
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "in": "header",
            "name": "Authorization",
            "description": "Enter: **'Bearer &lt;JWT&gt;'**, where JWT is the access token",
        }
    },
}
