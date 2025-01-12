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
    def get(self, org_id):
        """Get organization's events"""
        # Check org exists and user has access
        current_user_id = get_jwt_identity()
        org = Organization.query.get_or_404(org_id)

        if not org.has_user(User.query.get(current_user_id)):
            return {"message": "Not a member of this organization"}, 403

        # Build query
        query = Event.query.filter_by(organization_id=org_id)

        # Use pagination helper
        return paginate(query, EventSchema(many=True))

    @jwt_required()
    def post(self, org_id):
        """Create new event"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)
        org = Organization.query.get_or_404(org_id)

        # Must be admin to create events
        if not current_user.is_org_admin(org_id):
            return {"message": "Must be admin to create events"}, 403

        # Validate and create event
        schema = EventCreateSchema()
        data = schema.load(request.json)

        event = Event(**data)
        db.session.add(event)
        db.session.flush()  # Get event ID

        # Add current user as organizer
        event.add_user(current_user, EventUserRole.ORGANIZER)

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
    def get(self, event_id):
        """Get event details"""
        current_user_id = get_jwt_identity()
        event = Event.query.get_or_404(event_id)

        # Check if user has access to event
        if not event.has_user(User.query.get(current_user_id)):
            return {"message": "Not authorized to view this event"}, 403

        return EventDetailSchema().dump(event)

    @jwt_required()
    def put(self, event_id):
        """Update event"""
        current_user_id = get_jwt_identity()
        event = Event.query.get_or_404(event_id)

        # Check if user can edit event
        if not event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to edit this event"}, 403

        # Update event
        schema = EventUpdateSchema()
        event = schema.load(request.json, instance=event, partial=True)

        # Validate dates if updating them
        event.validate_dates()

        db.session.commit()

        return EventDetailSchema().dump(event)

    @jwt_required()
    def delete(self, event_id):
        """Delete event"""
        current_user_id = get_jwt_identity()
        event = Event.query.get_or_404(event_id)

        # Check if user can edit event
        if not event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to delete this event"}, 403

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
    def put(self, event_id):
        """Update event branding"""
        current_user_id = get_jwt_identity()
        event = Event.query.get_or_404(event_id)

        if not event.can_user_edit(User.query.get(current_user_id)):
            return {"message": "Not authorized to edit this event"}, 403

        schema = EventBrandingSchema()
        data = schema.load(request.json)

        event.update_branding(**data)
        db.session.commit()

        return EventDetailSchema().dump(event)
