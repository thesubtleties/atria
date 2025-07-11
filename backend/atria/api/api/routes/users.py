# api/api/routes/users.py
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, current_app

from api.api.schemas import (
    UserDetailSchema,
    UserUpdateSchema,
    EventSchema,
    SessionSchema,
    UserCheckResponseSchema,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.services.user import UserService

from api.models.enums import EventUserRole


blp = Blueprint(
    "users",
    "users",
    url_prefix="/api/users",
    description="Operations on users",
)


@blp.route("/<int:user_id>")
class UserResource(MethodView):
    @blp.response(200, UserDetailSchema)
    @blp.doc(
        summary="Get user profile",
        description="Get detailed information about a user",
        responses={
            403: {"description": "Not authorized to view this user"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user profile"""
        current_user_id = int(get_jwt_identity())

        # Check access
        if not UserService.check_user_access(current_user_id, user_id):
            return {"message": "Not authorized to view this profile"}, 403

        return UserService.get_user(user_id)

    @blp.arguments(UserUpdateSchema)
    @blp.response(200, UserDetailSchema)
    @blp.doc(
        summary="Update user profile",
        description="Update user's own profile information",
        responses={
            403: {"description": "Can only update own profile"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def put(self, update_data, user_id):
        """Update user profile"""
        current_user_id = int(get_jwt_identity())

        if current_user_id != user_id:
            return {"message": "Can only update own profile"}, 403

        return UserService.update_user(user_id, update_data)


@blp.route("/<int:user_id>/events")
class UserEventsResource(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Get user's events",
        description="Get all events a user is participating in",
        parameters=[
            {
                "in": "query",
                "name": "role",
                "schema": {"type": "string"},
                "description": "Filter by role in event (optional)",
                "enum": [role.value for role in EventUserRole],
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("events", "EventBase"),
            403: {"description": "Not authorized"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user's events"""
        role = request.args.get("role")

        return UserService.get_user_events(
            user_id, role, EventSchema(many=True)
        )


@blp.route("/<int:user_id>/speaking-sessions")
class UserSessionsResource(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Get user's speaking sessions",
        description="Get all sessions where user is speaking",
        parameters=[
            {
                "in": "query",
                "name": "page",
                "schema": {"type": "integer"},
                "description": "Page number (default: 1)",
            },
            {
                "in": "query",
                "name": "per_page",
                "schema": {"type": "integer"},
                "description": "Items per page (default: 50)",
            },
        ],
        responses={
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user's speaking sessions"""
        return UserService.get_user_speaking_sessions(
            user_id, SessionSchema(many=True)
        )


@blp.route("/debug")
class DebugView(MethodView):
    def get(self):
        """Debug endpoint"""
        return {
            "endpoints": [
                {
                    "url": str(rule),
                    "endpoint": rule.endpoint,
                    "methods": list(rule.methods),
                }
                for rule in current_app.url_map.iter_rules()
            ]
        }


@blp.route("/check-email")
class UserEmailCheck(MethodView):
    @blp.response(200, UserCheckResponseSchema)
    @blp.doc(
        summary="Check if user exists by email",
        description="Check if a user exists and return their basic info",
        parameters=[
            {
                "in": "query",
                "name": "email",
                "schema": {"type": "string"},
                "required": True,
                "description": "Email address to check",
            }
        ],
        responses={
            400: {"description": "Missing email parameter"},
        },
    )
    def get(self):
        """Check if user exists by email"""
        email = request.args.get("email")
        if not email:
            abort(400, message="Email parameter required")

        user = UserService.check_user_by_email(email)
        return {"user": user}
