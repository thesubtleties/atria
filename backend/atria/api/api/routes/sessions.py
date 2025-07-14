# api/api/routes/sessions.py
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required
from flask import request

from api.api.schemas import (
    SessionSchema,
    SessionDetailSchema,
    SessionCreateSchema,
    SessionUpdateSchema,
    SessionTimesUpdateSchema,
    SessionStatusUpdateSchema,
    SessionChatRoomSchema,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
    session_access_required,
)
from api.services.session import SessionService


blp = Blueprint(
    "sessions",
    "sessions",
    url_prefix="/api",
    description="Operations on sessions",
)


@blp.route("/events/<int:event_id>/sessions")
class SessionList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List event sessions",
        description="Get all sessions for an event",
        parameters=[
            {
                "in": "path",
                "name": "event_id",
                "schema": {"type": "integer"},
                "required": True,
                "example": 123,
            },
            {
                "in": "query",
                "name": "day_number",
                "schema": {"type": "integer"},
                "description": "Filter by day number",
                "example": 1,
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema(
                "sessions",
                "SessionDetail",
            ),
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_member_required()
    def get(self, event_id):
        """Get event's sessions"""
        day_number = request.args.get("day_number", type=int)

        return SessionService.get_event_sessions(
            event_id, day_number, SessionDetailSchema(many=True)
        )

    @blp.arguments(SessionCreateSchema)
    @blp.response(201, SessionDetailSchema)
    @blp.doc(
        summary="Create new session",
        description="Create a new session in the event",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "Session times must be within event dates"
                        }
                    }
                },
            },
            403: {
                "description": "Not authorized",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "You must be an event organizer to create sessions"
                        }
                    }
                },
            },
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, session_data, event_id):
        """Create new session"""
        try:
            session = SessionService.create_session(event_id, session_data)
            return session, 201
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/sessions/<int:session_id>")
class SessionResource(MethodView):
    @blp.response(200, SessionDetailSchema)
    @blp.doc(
        summary="Get session details",
        responses={
            403: {"description": "Not authorized to view this session"},
            404: {"description": "Session not found"},
        },
    )
    @jwt_required()
    @session_access_required()
    def get(self, session_id):
        """Get session details"""
        return SessionService.get_session(session_id)

    @blp.arguments(SessionUpdateSchema)
    @blp.response(200, SessionDetailSchema)
    @blp.doc(
        summary="Update session",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "Session times must be within event dates"
                        }
                    }
                },
            },
            403: {"description": "Not authorized to update this session"},
            404: {"description": "Session not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def put(self, update_data, session_id):
        """Update session"""
        try:
            return SessionService.update_session(session_id, update_data)
        except ValueError as e:
            abort(400, message=str(e))

    @blp.response(204)
    @blp.doc(
        summary="Delete session",
        responses={
            403: {"description": "Not authorized to delete this session"},
            404: {"description": "Session not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def delete(self, session_id):
        """Delete session"""
        SessionService.delete_session(session_id)
        return "", 204


@blp.route("/sessions/<int:session_id>/status")
class SessionStatusResource(MethodView):
    @blp.arguments(SessionStatusUpdateSchema)
    @blp.response(200, SessionDetailSchema)
    @blp.doc(
        summary="Update session status",
        responses={
            400: {"description": "Invalid status"},
            403: {"description": "Not authorized to update session status"},
            404: {"description": "Session not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def put(self, status_data, session_id):
        """Update session status"""
        return SessionService.update_session_status(
            session_id, status_data["status"]
        )


@blp.route("/sessions/<int:session_id>/times")
class SessionTimesResource(MethodView):
    @blp.arguments(SessionTimesUpdateSchema)
    @blp.response(200, SessionDetailSchema)
    @blp.doc(
        summary="Update session times",
        responses={
            400: {
                "description": "Invalid times",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "Session times must be within event dates"
                        }
                    }
                },
            },
            403: {"description": "Not authorized to update session times"},
            404: {"description": "Session not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def put(self, times_data, session_id):
        """Update session times"""
        try:
            return SessionService.update_session_times(
                session_id, times_data["start_time"], times_data["end_time"]
            )
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/sessions/<int:session_id>/chat-rooms")
class SessionChatRoomList(MethodView):
    @blp.response(200, SessionChatRoomSchema(many=True))
    @blp.doc(
        summary="Get session chat rooms",
        description="Get all chat rooms for a session (PUBLIC and BACKSTAGE)",
        responses={
            403: {"description": "Not authorized to view this session"},
            404: {"description": "Session not found"},
        },
    )
    @jwt_required()
    @session_access_required()
    def get(self, session_id):
        """Get session's chat rooms"""
        from api.models import ChatRoom, ChatMessage
        from api.models.enums import ChatRoomType
        from flask_jwt_extended import get_jwt_identity
        from api.models import User, Session
        from api.models.enums import EventUserRole
        
        # Get the session
        session = Session.query.get_or_404(session_id)
        
        # Check if chat is enabled for this session
        if not session.has_chat_enabled:
            return []
        
        # Get current user
        user_id = int(get_jwt_identity())
        current_user = User.query.get(user_id)
        
        # Check user's role in the event
        user_role = session.event.get_user_role(current_user)
        is_speaker = session.has_speaker(current_user)
        is_organizer = user_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]
        
        # Build query based on permissions
        query = ChatRoom.query.filter_by(session_id=session_id, is_enabled=True)
        
        # Apply chat mode restrictions
        from api.models.enums import SessionChatMode
        if session.chat_mode == SessionChatMode.BACKSTAGE_ONLY:
            # Only show backstage room, and only to speakers/organizers
            if not is_speaker and not is_organizer:
                return []
            query = query.filter(ChatRoom.room_type == ChatRoomType.BACKSTAGE)
        elif not is_speaker and not is_organizer:
            # Regular attendees only see PUBLIC rooms when chat is ENABLED
            query = query.filter(ChatRoom.room_type == ChatRoomType.PUBLIC)
        
        chat_rooms = query.all()
        
        # Add message count to each room
        for room in chat_rooms:
            room.message_count = ChatMessage.query.filter_by(room_id=room.id).count()
        
        return chat_rooms
