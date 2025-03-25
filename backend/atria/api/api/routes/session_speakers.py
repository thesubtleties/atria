# api/api/routes/session_speakers.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required
from flask import request

from api.models.enums import SessionSpeakerRole
from api.api.schemas import (
    SessionSpeakerSchema,
    SessionSpeakerDetailSchema,
    SessionSpeakerCreateSchema,
    SessionSpeakerUpdateSchema,
    SpeakerReorderSchema,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
)
from api.services.session_speaker import SessionSpeakerService


blp = Blueprint(
    "session_speakers",
    "session_speakers",
    url_prefix="/api",
    description="Operations on session speakers",
)


@blp.route("/sessions/<int:session_id>/speakers")
class SessionSpeakerList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List session speakers",
        parameters=[
            {
                "in": "path",
                "name": "session_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Session ID",
            },
            {
                "in": "query",
                "name": "role",
                "schema": {"type": "string"},
                "description": "Filter by role (optional)",
                "enum": [role.value for role in SessionSpeakerRole],
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema(
                "session_speakers", "SessionSpeakerBase"
            ),
            403: {"description": "Not authorized to view session speakers"},
            404: {"description": "Session not found"},
        },
    )
    @jwt_required()
    @event_member_required()
    def get(self, session_id):
        """Get list of session speakers"""
        # Get role filter if provided
        role = request.args.get("role")

        return SessionSpeakerService.get_session_speakers(
            session_id, role, SessionSpeakerSchema(many=True)
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
        try:
            speaker = SessionSpeakerService.add_speaker_to_session(
                session_id,
                data["user_id"],
                data.get("role", SessionSpeakerRole.SPEAKER),
                data.get("order"),
            )
            return speaker, 201
        except ValueError as e:
            return {"message": str(e)}, 400


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
        return SessionSpeakerService.update_speaker(
            session_id, user_id, update_data
        )

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
        SessionSpeakerService.remove_speaker(session_id, user_id)
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
        try:
            speakers = SessionSpeakerService.update_speaker_order(
                session_id, user_id, order_data["order"]
            )
            return speakers
        except ValueError as e:
            return {"message": str(e)}, 400
