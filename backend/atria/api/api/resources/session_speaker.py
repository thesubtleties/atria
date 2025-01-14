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

    post:
      tags:
        - session-speakers
      summary: Add speaker to session
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                user_id:
                  type: integer
                  required: true
                role:
                  type: string
                  enum: [SPEAKER, MODERATOR]
                  default: SPEAKER
                order:
                  type: integer
                  description: Optional display order
      responses:
        201:
          description: Speaker added successfully
          content:
            application/json:
              schema: SessionSpeakerDetailSchema
        400:
          description: Validation error or speaker conflicts
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Already a speaker in this session
        403:
          description: Not authorized
        404:
          description: Session or user not found
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
      summary: Update speaker role
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
          description: ID of the session
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
          description: ID of the speaker
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                role:
                  type: string
                  enum: [SPEAKER, MODERATOR]
                  required: true
      responses:
        200:
          description: Speaker role updated successfully
          content:
            application/json:
              schema: SessionSpeakerDetailSchema
        400:
          description: Invalid role
        403:
          description: Not authorized
        404:
          description: Speaker or session not found

    delete:
      tags:
        - session-speakers
      summary: Remove speaker from session
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
          description: ID of the session
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
          description: ID of the speaker to remove
      responses:
        200:
          description: Speaker successfully removed
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Speaker removed from session
        403:
          description: Not authorized
        404:
          description: Speaker or session not found
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
    Session speaker ordering operations
    ---
    put:
      tags:
        - session-speakers
      summary: Update speaker order
      parameters:
        - in: path
          name: session_id
          schema:
            type: integer
          required: true
          description: ID of the session
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
          description: ID of the speaker to reorder
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                order:
                  type: integer
                  minimum: 1
                  required: true
                  description: New position in speaker order
      responses:
        200:
          description: Speaker order updated successfully
          content:
            application/json:
              schema:
                type: array
                items: SessionSpeakerSchema
        400:
          description: Invalid order
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Order must be between 1 and total speakers"
        403:
          description: Not authorized
        404:
          description: Speaker or session not found
    """

    @jwt_required()
    @event_organizer_required()
    def put(self, session_id, user_id):
        """Update speaker order"""
        schema = SpeakerReorderSchema()
        data = schema.load(request.json)

        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        try:
            speakers = speaker.update_order(data["order"])
            db.session.commit()
            return SessionSpeakerSchema(many=True).dump(speakers)
        except ValueError as e:
            return {"message": str(e)}, 400
