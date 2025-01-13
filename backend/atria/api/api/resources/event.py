from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.extensions import db
from api.models import Event, Organization, User
from api.models.enums import EventUserRole
from api.api.schemas import (
    EventSchema,
    EventDetailSchema,
    EventCreateSchema,
    EventUpdateSchema,
    EventBrandingSchema,
)
from api.commons.pagination import paginate
from api.commons.decorators import (
    event_organizer_required,
    event_member_required,
    org_admin_required,
    org_member_required,
    event_admin_required,
)


class EventList(Resource):
    """
    Event list operations
    ---
    get:
      tags:
        - events
      summary: List organization events
      parameters:
        - in: path
          name: org_id
          schema:
            type: integer
          required: true
          description: Organization ID
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  results:
                    type: array
                    items: EventSchema

    post:
      tags:
        - events
      summary: Create new event
      parameters:
        - in: path
          name: org_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: EventCreateSchema
      responses:
        201:
          content:
            application/json:
              schema: EventDetailSchema
    """

    @jwt_required()
    @org_member_required()
    def get(self, org_id):
        """Get organization's events"""
        query = Event.query.filter_by(organization_id=org_id)
        return paginate(
            query, EventSchema(many=True), collection_name="events"
        )

    @jwt_required()
    @org_admin_required()
    def post(self, org_id):
        """Create new event"""
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)

        schema = EventCreateSchema()
        data = schema.load(request.json)

        event = Event(organization_id=org_id, **data)
        db.session.add(event)
        db.session.flush()

        # Make creator an ADMIN instead of just organizer?
        event.add_user(current_user, EventUserRole.ADMIN)

        db.session.commit()

        return EventDetailSchema().dump(event), 201


class EventResource(Resource):
    """
    Single event operations
    ---
    get:
      tags:
        - events
      summary: Get event details
      parameters:
        - in: path
          name: event_id
          schema:
            type: integer
          required: true
      responses:
        200:
          content:
            application/json:
              schema: EventDetailSchema

    put:
      tags:
        - events
      summary: Update event
      parameters:
        - in: path
          name: event_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: EventUpdateSchema
      responses:
        200:
          content:
            application/json:
              schema: EventDetailSchema

    delete:
      tags:
        - events
      summary: Delete event
      parameters:
        - in: path
          name: event_id
          schema:
            type: integer
          required: true
    """

    @jwt_required()
    @event_member_required()
    def get(self, event_id):
        """Get event details"""
        event = Event.query.get(event_id)  # No need for _or_404
        return EventDetailSchema().dump(event)

    @jwt_required()
    @event_organizer_required()
    def put(self, event_id):
        """Update event"""
        event = Event.query.get(event_id)

        schema = EventUpdateSchema()
        event = schema.load(request.json, instance=event, partial=True)
        event.validate_dates()

        db.session.commit()

        return EventDetailSchema().dump(event)

    @jwt_required()
    @event_admin_required()
    def delete(self, event_id):
        """Delete event"""
        event = Event.query.get_or_404(event_id)
        db.session.delete(event)
        db.session.commit()

        return {"message": "Event deleted successfully"}


class EventBrandingResource(Resource):
    """
    Event branding operations
    ---
    put:
      tags:
        - events
      summary: Update event branding
      parameters:
        - in: path
          name: event_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: EventBrandingSchema
    """

    @jwt_required()
    @event_organizer_required()
    def put(self, event_id):
        """Update event branding"""
        event = Event.query.get_or_404(event_id)

        schema = EventBrandingSchema()
        data = schema.load(request.json)

        event.update_branding(**data)
        db.session.commit()

        return EventDetailSchema().dump(event)
