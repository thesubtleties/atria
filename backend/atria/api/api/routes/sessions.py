from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required
from flask import request

from api.extensions import db
from api.models import Session, Event, User
from api.api.schemas import (
    SessionSchema,
    SessionDetailSchema,
    SessionCreateSchema,
    SessionUpdateSchema,
    SessionTimesUpdateSchema,
    SessionStatusUpdateSchema,
)
from api.commons.pagination import (
    paginate,
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
    session_access_required,
)


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
            *PAGINATION_PARAMETERS,  # imported from pagination helper
        ],
        responses={
            200: get_pagination_schema(
                "sessions", "SessionBase"
            ),  # imported from pagination helper
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_member_required()
    def get(self, event_id):
        """Get event's sessions"""
        query = Session.query.filter_by(event_id=event_id)

        day_number = request.args.get("day_number", type=int)
        if day_number:
            query = query.filter_by(day_number=day_number)

        query = query.order_by(Session.day_number, Session.start_time)

        return paginate(
            query, SessionSchema(many=True), collection_name="sessions"
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
        session = Session(event_id=event_id, **session_data)

        try:
            session.validate_times()
        except ValueError as e:
            return {"message": str(e)}, 400

        db.session.add(session)
        db.session.commit()

        return session, 201


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
        session = Session.query.get_or_404(session_id)
        # Remove the context argument
        return session

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
        session = Session.query.get_or_404(session_id)
        # time fields
        if "start_time" in update_data or "end_time" in update_data:
            try:
                if "start_time" in update_data:
                    session.start_time = update_data["start_time"]
                if "end_time" in update_data:
                    session.end_time = update_data["end_time"]
                session.validate_times()
            except ValueError as e:
                return {"message": str(e)}, 400
        # other fields
        for key, value in update_data.items():
            if key not in ["start_time", "end_time"]:
                setattr(session, key, value)
        db.session.commit()
        return session

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
        session = Session.query.get_or_404(session_id)
        db.session.delete(session)
        db.session.commit()
        return ""


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
        session = Session.query.get_or_404(session_id)
        session.update_status(status_data["status"])
        db.session.commit()
        schema = SessionDetailSchema()
        return schema.dump(session, context={"session_id": session_id})


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
        session = Session.query.get_or_404(session_id)

        try:
            session.update_times(
                times_data["start_time"], times_data["end_time"]
            )
            db.session.commit()
        except ValueError as e:
            return {"message": str(e)}, 400

        return session
