from flask import Blueprint, current_app, jsonify
from flask_restful import Api
from marshmallow import ValidationError
from api.extensions import apispec
from api.api.resources import (
    UserResource,
    UserList,
    UserEventsResource,  # Add import
    UserSessionsResource,  # Add import
)
from api.api.schemas import (
    UserSchema,
    EventSchema,
    SessionSchema,
    OrganizationSchema,
    EventUserSchema,
    OrganizationUserSchema,
    SessionSpeakerSchema,
)

blueprint = Blueprint("api", __name__, url_prefix="/api")
api = Api(blueprint)

# User routes
api.add_resource(UserResource, "/users/<int:user_id>")
api.add_resource(UserList, "/users")
api.add_resource(UserEventsResource, "/users/<int:user_id>/events")
api.add_resource(
    UserSessionsResource, "/users/<int:user_id>/speaking-sessions"
)


@blueprint.before_app_request
def register_views():
    """Register schemas and paths for API documentation"""
    schemas = {
        "UserSchema": UserSchema,
        "EventSchema": EventSchema,
        "SessionSchema": SessionSchema,
        "OrganizationSchema": OrganizationSchema,
        "EventUserSchema": EventUserSchema,
        "OrganizationUserSchema": OrganizationUserSchema,
        "SessionSpeakerSchema": SessionSpeakerSchema,
    }

    for name, schema in schemas.items():
        if name not in apispec.spec.components.schemas:
            apispec.spec.components.schema(name, schema=schema)

    # Register ALL paths for Swagger
    for resource in [
        UserResource,
        UserList,
        UserEventsResource,  # Add these to path registration
        UserSessionsResource,
    ]:
        apispec.spec.path(view=resource, app=current_app)


@blueprint.errorhandler(ValidationError)
def handle_marshmallow_error(e):
    """Return json error for marshmallow validation errors."""
    return jsonify(e.messages), 400
