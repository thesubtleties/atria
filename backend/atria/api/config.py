"""Default configuration

Use env var to override
"""

import os

ENV = os.getenv("FLASK_ENV", "development")
DEBUG = ENV == "development"
SECRET_KEY = os.getenv("SECRET_KEY", "changeme")

# Update to use SQLALCHEMY_DATABASE_URI from .flaskenv
SQLALCHEMY_DATABASE_URI = os.getenv("SQLALCHEMY_DATABASE_URI")
SQLALCHEMY_TRACK_MODIFICATIONS = False

# JWT settings (since we're using JWT)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key")
JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour

# Remove CELERY config since we're not using it
# CELERY = {
#     "broker_url": os.getenv("CELERY_BROKER_URL"),
#     "result_backend": os.getenv("CELERY_RESULT_BACKEND_URL"),
# }
