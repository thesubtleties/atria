from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required
from flask import request
from api.models.enums import EventUserRole
from api.schemas import (
    EventUserSchema,
    EventUserDetailSchema,
    EventUserCreateSchema,
    EventUserUpdateSchema,
    EventSpeakerInfoUpdateSchema,
    AddUserToEventSchema,
    EventUserAdminSchema,
    EventUserNetworkingSchema,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
    event_admin_required,
    event_organizer_or_org_owner_required,
    event_admin_or_org_owner_required,
)
from api.services.event_user import EventUserService


blp = Blueprint(
    "event_users",
    "event_users",
    url_prefix="/api",
    description="Operations on event users",
)


@blp.route("/events/<int:event_id>/users/add")
class AddEventUser(MethodView):
    @blp.arguments(AddUserToEventSchema)
    @blp.response(201, EventUserDetailSchema)
    @blp.doc(
        summary="Add or create user and add to event",
        description="Create a new user if needed and add them to the event",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "example": {"message": "User already in event"}
                    }
                },
            },
            403: {"description": "Not authorized to add users to event"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, data, event_id):
        """Add or create user and add to event"""
        try:
            event_user = EventUserService.add_or_create_user(event_id, data)
            return event_user, 201
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/events/<int:event_id>/users")
class EventUserList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List event users",
        description="Get all users associated with an event",
        parameters=[
            {
                "in": "path",
                "name": "event_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Event ID",
            },
            {
                "in": "query",
                "name": "role",
                "schema": {"type": "string"},
                "description": "Filter by role (optional)",
                "enum": [role.value for role in EventUserRole],
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("event_users", "EventUserBase"),
            403: {"description": "Not authorized to view event users"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_member_required()
    def get(self, event_id):
        """Get list of event users for networking - privacy-filtered view"""
        role = request.args.get("role")
        # Always use networking schema for consistent privacy-filtered view
        # Even admins see the public view here - they have AttendeesManager for full data
        return EventUserService.get_event_users_with_connection_status(
            event_id, role, EventUserNetworkingSchema(many=True)
        )

    @blp.arguments(EventUserCreateSchema)
    @blp.response(201, EventUserDetailSchema)
    @blp.doc(
        summary="Add user to event",
        description="Add a user to an event with a specific role",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "example": {"message": "User already in event"}
                    }
                },
            },
            403: {"description": "Not authorized to add users to event"},
            404: {"description": "Event or user not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, data, event_id):
        """Add user to event"""
        try:
            event_user = EventUserService.add_user_to_event(event_id, data)
            return event_user, 201
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/events/<int:event_id>/users/<int:user_id>")
class EventUserDetail(MethodView):
    @blp.arguments(EventUserUpdateSchema)
    @blp.response(200, EventUserDetailSchema)
    @blp.doc(
        summary="Update user role or info",
        description="Update a user's role or information in an event",
        responses={
            400: {"description": "Invalid role or information"},
            403: {"description": "Not authorized to update user roles"},
            404: {"description": "Event user not found"},
        },
    )
    @jwt_required()
    @event_admin_or_org_owner_required()
    def put(self, update_data, event_id, user_id):
        """Update user's role or info in event"""
        return EventUserService.update_user_role(
            event_id, user_id, update_data
        )

    @blp.response(200)
    @blp.doc(
        summary="Remove user from event",
        description="Remove a user from an event",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "example": {"message": "Cannot remove last admin"}
                    }
                },
            },
            403: {"description": "Not authorized to remove users"},
            404: {"description": "Event user not found"},
        },
    )
    @jwt_required()
    @event_admin_or_org_owner_required()
    def delete(self, event_id, user_id):
        """Remove user from event"""
        try:
            return EventUserService.remove_user_from_event(event_id, user_id)
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/events/<int:event_id>/users/admin")
class EventUserAdminList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List event users with admin details",
        description="Get all users with sensitive information (admin/organizer only)",
        parameters=[
            {
                "in": "path",
                "name": "event_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Event ID",
            },
            {
                "in": "query",
                "name": "role",
                "schema": {"type": "string"},
                "description": "Filter by role (optional)",
                "enum": [role.value for role in EventUserRole],
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("event_users", "EventUserAdmin"),
            403: {"description": "Not authorized to view admin details"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def get(self, event_id):
        """Get list of event users with admin details"""
        role = request.args.get("role")
        return EventUserService.get_event_users(
            event_id, role, EventUserAdminSchema(many=True)
        )


@blp.route("/events/<int:event_id>/users/<int:user_id>/speaker-info")
class EventSpeakerInfo(MethodView):
    @blp.arguments(EventSpeakerInfoUpdateSchema)
    @blp.response(200, EventUserDetailSchema)
    @blp.doc(
        summary="Update speaker info",
        description="Update speaker information for a user in an event",
        responses={
            400: {"description": "Invalid speaker information"},
            403: {"description": "Not authorized to update speaker info"},
            404: {"description": "Speaker not found or user is not a speaker"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def put(self, speaker_data, event_id, user_id):
        """Update speaker info"""
        return EventUserService.update_speaker_info(
            event_id, user_id, speaker_data
        )
