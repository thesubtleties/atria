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

# Swagger UI settings
APISPEC_SWAGGER_URL = "/swagger.json"  # Where to serve swagger.json
APISPEC_SWAGGER_UI_URL = "/swagger-ui"  # Where to serve swagger UI
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
