# api/api/routes/session_speakers.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required
from flask import request

from api.extensions import db
from api.models import Session, User, SessionSpeaker
from api.models.enums import SessionSpeakerRole
from api.api.schemas import (
    SessionSpeakerSchema,
    SessionSpeakerDetailSchema,
    SessionSpeakerCreateSchema,
    SessionSpeakerUpdateSchema,
    SpeakerReorderSchema,
)
from api.commons.pagination import paginate
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
)
from api.api.schemas.pagination import create_paginated_schema

blp = Blueprint(
    "session_speakers",
    "session_speakers",
    url_prefix="/api",
    description="Operations on session speakers",
)


@blp.route("/sessions/<int:session_id>/speakers")
class SessionSpeakerList(MethodView):
    @blp.response(
        200, create_paginated_schema(SessionSpeakerSchema, "session_speakers")
    )
    @blp.doc(
        summary="List session speakers",
        parameters=[
            {
                "in": "path",
                "name": "session_id",
                "schema": {"type": "integer"},
                "required": True,
            },
            {
                "in": "query",
                "name": "role",
                "schema": {"type": "string"},
                "description": "Filter by role (optional)",
            },
        ],
    )
    @jwt_required()
    @event_member_required()
    def get(self, session_id):
        """Get list of session speakers"""
        # Build query - order by speaker order
        query = SessionSpeaker.query.filter_by(session_id=session_id).order_by(
            SessionSpeaker.order
        )

        # Apply role filter if provided
        role = request.args.get("role")
        if role:
            query = query.filter_by(role=role)

        return paginate(
            query,
            SessionSpeakerSchema(many=True),
            collection_name="session_speakers",
        )

    @blp.arguments(SessionSpeakerCreateSchema)
    @blp.response(201, SessionSpeakerDetailSchema)
    @blp.doc(
        summary="Add speaker to session",
        responses={
            400: {
                "description": "Validation error or speaker conflicts",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "Already a speaker in this session"
                        }
                    }
                },
            },
            403: {"description": "Not authorized"},
            404: {"description": "Session or user not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, data, session_id):
        """Add speaker to session"""
        session = Session.query.get_or_404(session_id)
        new_speaker = User.query.get_or_404(data["user_id"])

        if session.has_speaker(new_speaker):
            return {"message": "Already a speaker in this session"}, 400

        if session.has_speaker_conflicts(new_speaker):
            return {"message": "Speaker has conflicting sessions"}, 400

        session.add_speaker(
            new_speaker,
            role=data.get("role", SessionSpeakerRole.SPEAKER),
            order=data.get("order"),
        )
        db.session.commit()

        return (
            SessionSpeaker.query.filter_by(
                session_id=session_id, user_id=new_speaker.id
            ).first(),
            201,
        )


@blp.route("/sessions/<int:session_id>/speakers/<int:user_id>")
class SessionSpeakerDetail(MethodView):
    @blp.arguments(SessionSpeakerUpdateSchema)
    @blp.response(200, SessionSpeakerDetailSchema)
    @blp.doc(
        summary="Update speaker role",
        description="Update a speaker's role in the session",
        responses={
            400: {"description": "Invalid role"},
            403: {"description": "Not authorized"},
            404: {"description": "Speaker or session not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def put(self, update_data, session_id, user_id):
        """Update speaker's role or order"""
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        if "role" in update_data:
            speaker.role = update_data["role"]
        if "order" in update_data:
            speaker.order = update_data["order"]

        db.session.commit()

        return speaker

    @blp.response(200)
    @blp.doc(
        summary="Remove speaker from session",
        description="Remove a speaker from the session",
        responses={
            200: {
                "description": "Speaker successfully removed",
                "content": {
                    "application/json": {
                        "example": {"message": "Speaker removed from session"}
                    }
                },
            },
            403: {"description": "Not authorized"},
            404: {"description": "Speaker or session not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def delete(self, session_id, user_id):
        """Remove speaker from session"""
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        db.session.delete(speaker)
        db.session.commit()

        return {"message": "Speaker removed from session"}


@blp.route("/sessions/<int:session_id>/speakers/<int:user_id>/reorder")
class SessionSpeakerReorder(MethodView):
    @blp.arguments(SpeakerReorderSchema)
    @blp.response(200, SessionSpeakerSchema(many=True))
    @blp.doc(
        summary="Update speaker order",
        description="Update the display order of a speaker",
        responses={
            400: {
                "description": "Invalid order",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "Order must be between 1 and total speakers"
                        }
                    }
                },
            },
            403: {"description": "Not authorized"},
            404: {"description": "Speaker or session not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def put(self, order_data, session_id, user_id):
        """Update speaker order"""
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        try:
            speakers = speaker.update_order(order_data["order"])
            db.session.commit()
            return speakers
        except ValueError as e:
            return {"message": str(e)}, 400
