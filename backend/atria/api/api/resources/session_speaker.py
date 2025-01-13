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
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
)


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

    @jwt_required()
    @event_organizer_required()
    def post(self, session_id):
        """Add speaker to session"""
        session = Session.query.get_or_404(session_id)

        schema = SessionSpeakerCreateSchema()
        data = schema.load(request.json)

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
    @event_organizer_required()
    def put(self, session_id, user_id):
        """Update speaker's role or order"""
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        schema = SessionSpeakerUpdateSchema()
        data = schema.load(request.json)

        if "role" in data:
            speaker.role = data["role"]
        if "order" in data:
            speaker.order = data["order"]

        db.session.commit()

        return SessionSpeakerDetailSchema().dump(speaker)

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
    @event_organizer_required()
    def put(self, session_id):
        """Reorder speakers"""
        schema = SpeakerReorderSchema()
        data = schema.load(request.json)

        SessionSpeaker.reorder_speakers(session_id, data["new_order"])
        db.session.commit()

        speakers = SessionSpeaker.get_ordered_speakers(session_id)
        return SessionSpeakerSchema(many=True).dump(speakers)
