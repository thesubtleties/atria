from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
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
from api.commons.pagination import paginate
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
    session_access_required,
)


class SessionList(Resource):
    """
    Session list operations
    ---
    get:
      tags:
        - sessions
      summary: List event sessions
      parameters:
        - in: path
          name: event_id
          schema:
            type: integer
          required: true
          example: 123
        - in: query
          name: day_number
          schema:
            type: integer
          description: Filter by day number
          example: 1
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  results:
                    type: array
                    items: SessionSchema
              example:
                results: [
                  {
                    "title": "Opening Keynote: Future of Cloud Computing",
                    "description": "Join our CEO for an inspiring look at the future of cloud technology and digital transformation",
                    "session_type": "KEYNOTE",
                    "start_time": "2025-06-15T09:00:00.000Z",
                    "end_time": "2025-06-15T10:00:00.000Z",
                    "stream_url": "https://stream.techcorp.com/keynote-2025",
                    "status": "SCHEDULED",
                    "day_number": 1
                  }
                ]

    post:
      tags:
        - sessions
      summary: Create new session
      parameters:
        - in: path
          name: event_id
          schema:
            type: integer
          required: true
          example: 123
      requestBody:
        content:
          application/json:
            schema: SessionCreateSchema
            example:
              title: "Opening Keynote: Future of Cloud Computing"
              description: "Join our CEO for an inspiring look at the future of cloud technology and digital transformation"
              session_type: "KEYNOTE"
              start_time: "2025-06-15T09:00:00.000Z"
              end_time: "2025-06-15T10:00:00.000Z"
              stream_url: "https://stream.techcorp.com/keynote-2025"
              status: "SCHEDULED"
              day_number: 1
      responses:
        201:
          description: Session created successfully
          content:
            application/json:
              schema: SessionDetailSchema
              example:
                id: "789e4567-e89b-12d3-a456-426614174000"
                title: "Opening Keynote: Future of Cloud Computing"
                description: "Join our CEO for an inspiring look at the future of cloud technology and digital transformation"
                session_type: "KEYNOTE"
                start_time: "2025-06-15T09:00:00.000Z"
                end_time: "2025-06-15T10:00:00.000Z"
                stream_url: "https://stream.techcorp.com/keynote-2025"
                status: "SCHEDULED"
                day_number: 1
                event_id: 123
        400:
          description: Validation error
          content:
            application/json:
              example:
                message: "Validation error"
                errors:
                  start_time: ["Session times must be within event dates"]
        403:
          description: Not authorized
          content:
            application/json:
              example:
                message: "You must be an event organizer to create sessions"
    """

    @jwt_required()
    @event_member_required()
    def get(self, event_id):
        """Get event's sessions"""
        # Build query
        query = Session.query.filter_by(event_id=event_id)

        # Filter by day if provided
        day_number = request.args.get("day_number", type=int)
        if day_number:
            query = query.filter_by(day_number=day_number)

        # Order by start time
        query = query.order_by(Session.start_time)

        return paginate(
            query, SessionSchema(many=True), collection_name="sessions"
        )

    @jwt_required()
    @event_organizer_required()
    def post(self, event_id):
        """Create new session"""
        # Validate and create session
        schema = SessionCreateSchema()
        data = schema.load(request.json)

        # Make sure session is associated with event
        session = Session(event_id=event_id, **data)

        # Validate session times against event dates
        try:
            session.validate_times()
        except ValueError as e:
            return {"message": str(e)}, 400

        db.session.add(session)
        db.session.commit()

        return SessionDetailSchema().dump(session), 201


class SessionResource(Resource):
    """
    Single session operations
    ---
    get:
      tags:
        - sessions
      summary: Get session details
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
      responses:
        200:
          content:
            application/json:
              schema: SessionDetailSchema

    put:
      tags:
        - sessions
      summary: Update session
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: SessionUpdateSchema
      responses:
        200:
          description: Session updated successfully
          content:
            application/json:
              schema: SessionDetailSchema
        400:
          description: Validation error
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        403:
          description: Not authorized

    delete:
      tags:
        - sessions
      summary: Delete session
    """

    @jwt_required()
    @session_access_required()
    def get(self, session_id):
        """Get session details"""
        session = Session.query.get_or_404(session_id)

        return SessionDetailSchema().dump(session)

    @jwt_required()
    @event_organizer_required()
    def put(self, session_id):
        """Update session"""
        session = Session.query.get_or_404(session_id)

        schema = SessionUpdateSchema()
        data = schema.load(request.json, partial=True)

        for key, value in data.items():
            setattr(session, key, value)

        # validate_times() on the session object (not the data dict)
        if "start_time" in request.json or "end_time" in request.json:
            try:
                session.validate_times()
            except ValueError as e:
                return {"message": str(e)}, 400

        db.session.commit()

        return SessionDetailSchema().dump(session)

    @jwt_required()
    @event_organizer_required()
    def delete(self, session_id):
        """Delete session"""
        session = Session.query.get_or_404(session_id)

        db.session.delete(session)
        db.session.commit()

        return {"message": "Session deleted successfully"}


class SessionStatusResource(Resource):
    """
    Session status operations
    ---
    put:
      tags:
        - sessions
      summary: Update session status
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: SessionStatusUpdateSchema
    """

    @jwt_required()
    @event_organizer_required()
    def put(self, session_id):
        """Update session status"""
        session = Session.query.get_or_404(session_id)

        schema = SessionStatusUpdateSchema()
        data = schema.load(request.json)

        session.update_status(data["status"])
        db.session.commit()

        return SessionDetailSchema().dump(session)


class SessionTimesResource(Resource):
    """
    Session times operations
    ---
    put:
      tags:
        - sessions
      summary: Update session times
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: SessionTimesUpdateSchema
    """

    @jwt_required()
    @event_organizer_required()
    def put(self, session_id):
        """Update session times"""
        session = Session.query.get_or_404(session_id)

        schema = SessionTimesUpdateSchema()
        data = schema.load(request.json)

        try:
            session.update_times(data["start_time"], data["end_time"])
            db.session.commit()
        except ValueError as e:
            return {"message": str(e)}, 400

        return SessionDetailSchema().dump(session)
