from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required
from flask import request

from api.extensions import db
from api.models import Event, User, EventUser, Session, SessionSpeaker
from api.models.enums import EventUserRole
from api.api.schemas import (
    EventUserSchema,
    EventUserDetailSchema,
    EventUserCreateSchema,
    EventUserUpdateSchema,
    EventSpeakerInfoUpdateSchema,
)
from api.commons.pagination import paginate
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
    event_admin_required,
)
from api.api.schemas.pagination import create_paginated_schema

blp = Blueprint(
    "event_users",
    "event_users",
    url_prefix="/api",
    description="Operations on event users",
)


@blp.route("/events/<int:event_id>/users")
class EventUserList(MethodView):
    @blp.response(200, create_paginated_schema(EventUserSchema, "event_users"))
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
                "enum": [
                    "ADMIN",
                    "ORGANIZER",
                    "MODERATOR",
                    "SPEAKER",
                    "ATTENDEE",
                ],
            },
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
            403: {"description": "Not authorized to view event users"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_member_required()
    def get(self, event_id):
        """Get list of event users"""
        query = EventUser.query.filter_by(event_id=event_id)

        role = request.args.get("role")
        if role:
            query = query.filter_by(role=role)

        return paginate(
            query, EventUserSchema(many=True), collection_name="event_users"
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
        new_user = User.query.get_or_404(data["user_id"])
        event = Event.query.get_or_404(event_id)

        if event.has_user(new_user):
            return {"message": "User already in event"}, 400

        event.add_user(
            new_user,
            data["role"],
            speaker_bio=data.get("speaker_bio"),
            speaker_title=data.get("speaker_title"),
        )
        db.session.commit()

        return (
            EventUser.query.filter_by(
                event_id=event_id, user_id=new_user.id
            ).first(),
            201,
        )


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
    @event_organizer_required()
    def put(self, update_data, event_id, user_id):
        """Update user's role or info in event"""
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first_or_404()

        if "role" in update_data:
            event_user.role = update_data["role"]

        if event_user.role == EventUserRole.SPEAKER:
            if "speaker_bio" in update_data:
                event_user.speaker_bio = update_data["speaker_bio"]
            if "speaker_title" in update_data:
                event_user.speaker_title = update_data["speaker_title"]

        db.session.commit()
        return event_user

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
    @event_admin_required()
    def delete(self, event_id, user_id):
        """Remove user from event"""
        event = Event.query.get_or_404(event_id)
        target_user = User.query.get_or_404(user_id)
        target_role = event.get_user_role(target_user)

        if (
            target_role == EventUserRole.ADMIN
            and len(
                [
                    eu
                    for eu in event.event_users
                    if eu.role == EventUserRole.ADMIN
                ]
            )
            <= 1
        ):
            return {"message": "Cannot remove last admin"}, 400

        # Remove from sessions using subquery
        session_ids = Session.query.filter_by(event_id=event_id).with_entities(
            Session.id
        )
        SessionSpeaker.query.filter(
            SessionSpeaker.session_id.in_(session_ids),
            SessionSpeaker.user_id == user_id,
        ).delete(synchronize_session=False)

        # Then remove from event
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first_or_404()

        db.session.delete(event_user)
        db.session.commit()

        return {"message": "User removed from event"}


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
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id, role=EventUserRole.SPEAKER
        ).first_or_404()

        event_user.update_speaker_info(**speaker_data)
        db.session.commit()

        return event_user
