"""Extensions registry

All extensions here are used as singletons and
initialized in application factory
"""

from flask_sqlalchemy import SQLAlchemy
from passlib.context import CryptContext
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_smorest import Api

from api.commons.apispec import APISpecExt


db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()
migrate = Migrate()
apispec = APISpecExt()  # Keep for now during migration
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
smorest_api = Api()  # Add this

# celery off for now
# from celery import Celery
