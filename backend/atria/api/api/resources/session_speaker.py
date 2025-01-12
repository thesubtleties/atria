from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
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


class SessionSpeakerList(Resource):
    """
    Session speaker list operations
    ---
    get:
      tags:
        - session-speakers
      summary: List session speakers
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
        - in: query
          name: role
          schema:
            type: string
          description: Filter by role (optional)
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  results:
                    type: array
                    items: SessionSpeakerSchema
    """

    @jwt_required()
    def get(self, session_id):
        """Get list of session speakers"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user has access to event
        if not session.event.has_user(User.query.get(current_user_id)):
            return {"message": "Not authorized to view this session"}, 403

        # Build query - order by speaker order
        query = SessionSpeaker.query.filter_by(session_id=session_id).order_by(
            SessionSpeaker.order
        )

        # Apply role filter if provided
        role = request.args.get("role")
        if role:
            query = query.filter_by(role=role)

        return paginate(query, SessionSpeakerSchema(many=True))

    @jwt_required()
    def post(self, session_id):
        """Add speaker to session"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user can edit event
        if not session.event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to add speakers"}, 403

        # Validate and load data
        schema = SessionSpeakerCreateSchema()
        data = schema.load(request.json)

        # Get user to add
        new_speaker = User.query.get_or_404(data["user_id"])

        # Check if already a speaker
        if session.has_speaker(new_speaker):
            return {"message": "Already a speaker in this session"}, 400

        # Check for scheduling conflicts
        if session.has_speaker_conflicts(new_speaker):
            return {"message": "Speaker has conflicting sessions"}, 400

        # Add speaker with role and optional order
        session.add_speaker(
            new_speaker,
            role=data.get("role", SessionSpeakerRole.SPEAKER),
            order=data.get("order"),  # Will be auto-set if not provided
        )
        db.session.commit()

        return (
            SessionSpeakerDetailSchema().dump(
                SessionSpeaker.query.filter_by(
                    session_id=session_id, user_id=new_speaker.id
                ).first()
            ),
            201,
        )


class SessionSpeakerDetail(Resource):
    """
    Single session speaker operations
    ---
    put:
      tags:
        - session-speakers
      summary: Update speaker details
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: SessionSpeakerUpdateSchema
    """

    @jwt_required()
    def put(self, session_id, user_id):
        """Update speaker's role or order"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user can edit event
        if not session.event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to update speakers"}, 403

        # Get speaker record
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        # Update role and/or order
        schema = SessionSpeakerUpdateSchema()
        data = schema.load(request.json)

        if "role" in data:
            speaker.role = data["role"]
        if "order" in data:
            speaker.order = data["order"]

        db.session.commit()

        return SessionSpeakerDetailSchema().dump(speaker)

    @jwt_required()
    def delete(self, session_id, user_id):
        """Remove speaker from session"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user can edit event
        if not session.event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to remove speakers"}, 403

        # Get and remove speaker
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        db.session.delete(speaker)
        db.session.commit()

        return {"message": "Speaker removed from session"}


class SessionSpeakerReorder(Resource):
    """
    Speaker reordering operations
    ---
    put:
      tags:
        - session-speakers
      summary: Reorder session speakers
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: SpeakerReorderSchema
    """

    @jwt_required()
    def put(self, session_id):
        """Reorder speakers"""
        current_user_id = get_jwt_identity()
        session = Session.query.get_or_404(session_id)

        # Check if user can edit event
        if not session.event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to reorder speakers"}, 403

        # Validate order data
        schema = SpeakerReorderSchema()
        data = schema.load(request.json)

        # Use model method to reorder
        SessionSpeaker.reorder_speakers(session_id, data["new_order"])
        db.session.commit()

        # Return updated order
        speakers = SessionSpeaker.get_ordered_speakers(session_id)
        return SessionSpeakerSchema(many=True).dump(speakers)
