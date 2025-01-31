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
          example: 123
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
              example:
                results: [
                  {
                    "title": "TechCorp DevCon 2025",
                    "event_type": "CONFERENCE",
                    "start_date": "2025-06-15T00:00:00.000Z",
                    "end_date": "2025-06-18T00:00:00.000Z",
                    "company_name": "TechCorp International",
                    "description": "Annual developer conference featuring workshops, keynotes, and networking opportunities in cloud computing and AI",
                    "status": "DRAFT",
                    "branding": {
                      "primary_color": "#4A90E2",
                      "secondary_color": "#2C3E50",
                      "logo_url": "https://example.com/logo.png",
                      "banner_url": null
                    }
                  }
                ]

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
          example: 123
      requestBody:
        content:
          application/json:
            schema: EventCreateSchema
            example:
              title: "TechCorp DevCon 2025"
              event_type: "CONFERENCE"
              start_date: "2025-06-15T00:00:00.000Z"
              end_date: "2025-06-18T00:00:00.000Z"
              company_name: "TechCorp International"
              description: "Annual developer conference featuring workshops, keynotes, and networking opportunities in cloud computing and AI"
              status: "DRAFT"
              branding:
                primary_color: "#4A90E2"
                secondary_color: "#2C3E50"
                logo_url: "https://example.com/logo.png"
                banner_url: null
      responses:
        201:
          content:
            application/json:
              schema: EventDetailSchema
              example:
                id: "123e4567-e89b-12d3-a456-426614174000"
                title: "TechCorp DevCon 2025"
                event_type: "CONFERENCE"
                start_date: "2025-06-15T00:00:00.000Z"
                end_date: "2025-06-18T00:00:00.000Z"
                company_name: "TechCorp International"
                description: "Annual developer conference featuring workshops, keynotes, and networking opportunities in cloud computing and AI"
                status: "DRAFT"
                branding:
                  primary_color: "#4A90E2"
                  secondary_color: "#2C3E50"
                  logo_url: "https://example.com/logo.png"
                  banner_url: null
        400:
          description: Validation error
          content:
            application/json:
              example:
                message: "Validation error"
                errors:
                  start_date: ["Start date must be in the future"]
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
        event = Event.query.get(event_id)
        return EventDetailSchema().dump(event)

    @jwt_required()
    @event_organizer_required()
    def put(self, event_id):
        """Update event"""
        event = Event.query.get(event_id)

        schema = EventUpdateSchema()
        data = schema.load(request.json, partial=True)

        for key, value in data.items():
            setattr(event, key, value)

        if "start_date" in request.json or "end_date" in request.json:
            try:
                event.validate_dates()
            except ValueError as e:
                return {"message": str(e)}, 400

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
