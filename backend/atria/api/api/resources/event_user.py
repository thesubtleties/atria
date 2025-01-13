from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.extensions import db
from api.models import Event, User, EventUser
from api.models.enums import EventUserRole
from api.api.schemas import (
    EventUserSchema,
    EventUserDetailSchema,
    EventUserCreateSchema,
    EventUserUpdateSchema,
    SpeakerInfoUpdateSchema,
)
from api.commons.pagination import paginate
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
    event_admin_required,
)


class EventUserList(Resource):
    """
    Event user list operations
    ---
    get:
      tags:
        - event-users
      summary: List event users
      parameters:
        - in: path
          name: event_id
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
                    items: EventUserSchema

    post:
      tags:
        - event users
      summary: Add user to event
      parameters:
        - in: path
          name: event_id
          schema:
            type: integer
          required: true
          description: ID of event to add user to
      requestBody:
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
                  enum: [ADMIN, ORGANIZER, SPEAKER, ATTENDEE, MODERATOR]
                  default: ATTENDEE
                speaker_bio:
                  type: string
                speaker_title:
                  type: string
      responses:
        201:
          description: User added to event successfully
          content:
            application/json:
              schema: EventUserSchema
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
        404:
          description: Event or user not found
    """

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

    @jwt_required()
    @event_organizer_required()
    def post(self, event_id):
        """Add user to event"""
        schema = EventUserCreateSchema()
        data = schema.load(request.json)

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
            EventUserDetailSchema().dump(
                EventUser.query.filter_by(
                    event_id=event_id, user_id=new_user.id
                ).first()
            ),
            201,
        )


class EventUserDetail(Resource):
    """
    Single event user operations
    ---
    put:
      tags:
        - event-users
      summary: Update user role or info
      parameters:
        - in: path
          name: event_id
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
            schema: EventUserUpdateSchema
      responses:
        200:
          description: User updated successfully
          content:
            application/json:
              schema: EventUserDetailSchema
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
        404:
          description: User or event not found

    delete:
      tags:
        - event-users
      summary: Remove user from event
      parameters:
        - in: path
          name: event_id
          schema:
            type: integer
          required: true
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
      responses:
        200:
          description: User removed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        400:
          description: Cannot remove last organizer
        403:
          description: Not authorized
        404:
          description: User or event not found
    """

    @jwt_required()
    @event_organizer_required()
    def put(self, event_id, user_id):
        """Update user's role or info in event"""
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first_or_404()

        schema = EventUserUpdateSchema()
        data = schema.load(request.json)

        if "role" in data:
            event_user.role = data["role"]

        if event_user.role == EventUserRole.SPEAKER:
            if "speaker_bio" in data:
                event_user.speaker_bio = data["speaker_bio"]
            if "speaker_title" in data:
                event_user.speaker_title = data["speaker_title"]

        db.session.commit()
        return EventUserDetailSchema().dump(event_user)

    @jwt_required()
    @event_admin_required()
    def delete(self, event_id, user_id):
        """Remove user from event"""
        current_user_id = int(get_jwt_identity())
        event = Event.query.get(event_id)
        target_user = User.query.get_or_404(user_id)

        # Keep last organizer check
        if (
            current_user_id == user_id
            and event.get_user_role(target_user) == EventUserRole.ORGANIZER
            and len(event.organizers) == 1
        ):
            return {"message": "Cannot remove last organizer"}, 400

        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first_or_404()

        db.session.delete(event_user)
        db.session.commit()
        return {"message": "User removed from event"}


class EventSpeakerInfo(Resource):
    """
    Speaker info operations
    ---
    put:
      tags:
        - event-users
      summary: Update speaker info
      parameters:
        - in: path
          name: event_id
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
            schema: SpeakerInfoUpdateSchema
      responses:
        200:
          description: Speaker info updated successfully
          content:
            application/json:
              schema: EventUserDetailSchema
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
        404:
          description: User not found or not a speaker
    """

    @jwt_required()
    @event_organizer_required()
    def put(self, event_id, user_id):
        """Update speaker info"""
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id, role=EventUserRole.SPEAKER
        ).first_or_404()

        schema = SpeakerInfoUpdateSchema()
        data = schema.load(request.json)

        event_user.update_speaker_info(**data)
        db.session.commit()

        return EventUserDetailSchema().dump(event_user)
