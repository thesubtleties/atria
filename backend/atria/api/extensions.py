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
from flask.json.provider import JSONProvider
from datetime import time
from flask_socketio import SocketIO


# Redis clients (initialized in app factory)
# Note: Socket.IO pub/sub uses DB 1 via its own internal connection (message_queue parameter)
redis_client = None   # General purpose (DB 0) - currently unused
cache_redis = None    # Application caching (DB 2)
presence_redis = None # Presence & typing indicators (DB 3)

# serialize time objects
# class CustomJSONProvider(JSONProvider):
#     def default(self, obj):
#         print(f"CustomJSONProvider.default called with: {type(obj)}")  # Debug
#         if isinstance(obj, time):
#             print(f"Converting time object: {obj}")  # Debug
#             return obj.strftime("%H:%M:%S")
#         return super().default(obj)

#     def dumps(self, obj, **kwargs):
#         print("CustomJSONProvider.dumps called")  # Debug
#         kwargs.setdefault("default", self.default)
#         return json.dumps(obj, **kwargs)


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
smorest_api = Api()
socketio = SocketIO()
