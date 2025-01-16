from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, current_app
from sqlalchemy import distinct

from api.extensions import db
from api.models import User, Event, EventUser
from api.models.enums import EventUserRole
from api.api.schemas import (
    UserDetailSchema,
    UserUpdateSchema,
    EventSchema,
    SessionSchema,
)
from api.commons.pagination import (
    paginate,
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)


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
        current_user = User.query.get_or_404(current_user_id)
        user = User.query.get_or_404(user_id)

        # Can view if:
        # 1. It's your own profile
        if current_user_id == user_id:
            return user

        # 2. You share any events
        shared_events = (
            Event.query.join(EventUser)
            .filter(EventUser.user_id.in_([current_user_id, user_id]))
            .group_by(Event.id)
            .having(db.func.count(distinct(EventUser.user_id)) > 1)
            .all()
        )

        # 3. You're an admin in any of their orgs
        is_org_admin = any(
            current_user.is_org_admin(org.id) for org in user.organizations
        )

        if shared_events or is_org_admin:
            return user

        return {"message": "Not authorized to view this profile"}, 403

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

        user = User.query.get_or_404(user_id)
        for key, value in update_data.items():
            setattr(user, key, value)

        db.session.commit()
        return user


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
                "enum": [
                    role.value for role in EventUserRole
                ],  # Dynamic from enum
            },
            *PAGINATION_PARAMETERS,  # imported from pagination helper
        ],
        responses={
            200: get_pagination_schema(
                "events", "EventBase"
            ),  # imported from pagination helper
            403: {"description": "Not authorized"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user's events"""
        user = User.query.get_or_404(user_id)
        role = request.args.get("role")

        if role:
            query = user.get_events_by_role(role)
        else:
            query = Event.query.join(EventUser).filter(
                EventUser.user_id == user_id
            )

        return paginate(
            query, EventSchema(many=True), collection_name="events"
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
        user = User.query.get_or_404(user_id)
        query = user.get_speaking_sessions()
        return paginate(
            query, SessionSchema(many=True), collection_name="sessions"
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
