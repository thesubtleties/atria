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
        - in: query
          name: day_number
          schema:
            type: integer
          description: Filter by day number
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
      requestBody:
        content:
          application/json:
            schema: SessionCreateSchema
    """

    @jwt_required()
    def get(self, event_id):
        """Get event's sessions"""
        current_user_id = get_jwt_identity()
        event = Event.query.get_or_404(event_id)

        # Check if user has access to event
        if not event.has_user(User.query.get(current_user_id)):
            return {"message": "Not authorized to view this event"}, 403

        # Build query
        query = Session.query.filter_by(event_id=event_id)

        # Filter by day if provided
        day_number = request.args.get("day_number", type=int)
        if day_number:
            query = query.filter_by(day_number=day_number)

        # Order by start time
        query = query.order_by(Session.start_time)

        return paginate(query, SessionSchema(many=True))

    @jwt_required()
    def post(self, event_id):
        """Create new session"""
        current_user_id = get_jwt_identity()
        event = Event.query.get_or_404(event_id)

        # Check if user can edit event
        if not event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to create sessions"}, 403

        # Validate and create session
        schema = SessionCreateSchema()
        data = schema.load(request.json)

        session = Session(**data)

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

    delete:
      tags:
        - sessions
      summary: Delete session
    """

    @jwt_required()
    def get(self, session_id):
        """Get session details"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user has access to event
        if not session.event.has_user(User.query.get(current_user_id)):
            return {"message": "Not authorized to view this session"}, 403

        return SessionDetailSchema().dump(session)

    @jwt_required()
    def put(self, session_id):
        """Update session"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user can edit event
        if not session.event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to update session"}, 403

        # Update session
        schema = SessionUpdateSchema()
        session = schema.load(request.json, instance=session, partial=True)

        # Validate times if updating them
        if "start_time" in request.json or "end_time" in request.json:
            try:
                session.validate_times()
            except ValueError as e:
                return {"message": str(e)}, 400

        db.session.commit()

        return SessionDetailSchema().dump(session)

    @jwt_required()
    def delete(self, session_id):
        """Delete session"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user can edit event
        if not session.event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to delete session"}, 403

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
    def put(self, session_id):
        """Update session status"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user can edit event
        if not session.event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to update session"}, 403

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
    def put(self, session_id):
        """Update session times"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user can edit event
        if not session.event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to update session"}, 403

        schema = SessionTimesUpdateSchema()
        data = schema.load(request.json)

        try:
            session.update_times(data["start_time"], data["end_time"])
            db.session.commit()
        except ValueError as e:
            return {"message": str(e)}, 400

        return SessionDetailSchema().dump(session)
