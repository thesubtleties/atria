"""Extensions registry

All extensions here are used as singletons and
initialized in application factory
"""

from flask_sqlalchemy import SQLAlchemy
from passlib.context import CryptContext
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_smorest import Api as BaseApi
from apispec.ext.marshmallow import MarshmallowPlugin

# from api.commons.apispec import APISpecExt


def schema_name_resolver(schema):
    """Custom resolver to handle nested schema names"""
    if hasattr(schema, "__nested_in__"):
        parent_schema = schema.__nested_in__.__class__
        field_name = schema.__field_name__
        return f"{parent_schema.__name__}_{field_name}_Schema"

    if hasattr(schema, "Meta") and hasattr(schema.Meta, "name"):
        return schema.Meta.name
    print(schema.__class__.__name__)
    return schema.__class__.__name__


class Api(BaseApi):
    def __init__(self, app=None, **kwargs):
        spec_kwargs = kwargs.pop("spec_kwargs", {})
        spec_kwargs["marshmallow_plugin"] = MarshmallowPlugin(
            schema_name_resolver=schema_name_resolver
        )
        super().__init__(app, spec_kwargs=spec_kwargs)


db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()
migrate = Migrate()
# apispec = APISpecExt()  # Keep for now during migration
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
smorest_api = Api()  # Add this

# celery off for now
# from celery import Celery
