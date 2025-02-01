from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

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
from api.commons.decorators import (
    event_organizer_required,
    event_member_required,
    org_admin_required,
    org_member_required,
    event_admin_required,
)
from api.commons.pagination import (
    paginate,
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)


blp = Blueprint(
    "events",
    "events",
    url_prefix="/api",
    description="Operations on events",
)


@blp.route("/organizations/<int:org_id>/events")
class EventList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List organization events",
        description="Get all events for an organization",
        parameters=[
            {
                "in": "path",
                "name": "org_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Organization ID",
                "example": 123,
            },
            *PAGINATION_PARAMETERS,  # imported from pagination helper
        ],
        responses={
            200: get_pagination_schema(
                "events", "EventBase"
            ),  # imported from pagination helper
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_member_required()
    def get(self, org_id):
        """Get organization's events"""
        query = Event.query.filter_by(organization_id=org_id)
        return paginate(
            query, EventSchema(many=True), collection_name="events"
        )

    @blp.arguments(EventCreateSchema)
    @blp.response(201, EventDetailSchema)
    @blp.doc(
        summary="Create new event",
        description="Create a new event in the organization",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "Validation error",
                            "errors": {
                                "start_date": [
                                    "Start date must be in the future"
                                ]
                            },
                        }
                    }
                },
            },
            403: {"description": "Not authorized"},
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_admin_required()
    def post(self, event_data, org_id):
        """Create new event"""
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)

        event = Event(organization_id=org_id, **event_data)
        db.session.add(event)
        db.session.flush()

        event.add_user(current_user, EventUserRole.ADMIN)
        db.session.commit()

        return event, 201


@blp.route("/events/<int:event_id>")
class EventResource(MethodView):
    @blp.response(200, EventDetailSchema)
    @blp.doc(
        summary="Get event details",
        responses={
            403: {"description": "Not authorized to view this event"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_member_required()
    def get(self, event_id):
        """Get event details"""
        event = Event.query.get_or_404(event_id)
        return event

    @blp.arguments(EventUpdateSchema)
    @blp.response(200, EventDetailSchema)
    @blp.doc(
        summary="Update event",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "End date must be after start date"
                        }
                    }
                },
            },
            403: {"description": "Not authorized to update this event"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def put(self, update_data, event_id):
        """Update event"""
        event = Event.query.get_or_404(event_id)

        try:
            # Validate dates first if they're being updated
            if "start_date" in update_data or "end_date" in update_data:
                event.validate_dates(
                    update_data.get("start_date"), update_data.get("end_date")
                )

            # If validation passed, update all fields
            for key, value in update_data.items():
                setattr(event, key, value)

            db.session.commit()
            return event

        except ValueError as e:
            return {"message": str(e)}, 400

    @blp.response(204)
    @blp.doc(
        summary="Delete event",
        responses={
            403: {"description": "Not authorized to delete this event"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_admin_required()
    def delete(self, event_id):
        """Delete event"""
        event = Event.query.get_or_404(event_id)
        db.session.delete(event)
        db.session.commit()
        return ""


@blp.route("/events/<int:event_id>/branding")
class EventBrandingResource(MethodView):
    @blp.arguments(EventBrandingSchema)
    @blp.response(200, EventDetailSchema)
    @blp.doc(
        summary="Update event branding",
        responses={
            400: {"description": "Invalid branding data"},
            403: {"description": "Not authorized to update event branding"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def put(self, branding_data, event_id):
        """Update event branding"""
        event = Event.query.get_or_404(event_id)
        event.update_branding(**branding_data)
        db.session.commit()
        return event
