from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

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
    org_owner_required,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.services.event import EventService


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
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("events", "EventBase"),
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_member_required()
    def get(self, org_id):
        """Get organization's events"""
        return EventService.get_organization_events(
            org_id, EventSchema(many=True)
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
        event = EventService.create_event(org_id, event_data, current_user_id)
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
        return EventService.get_event(event_id)

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
                            "message": "End date cannot be before start date"
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
        try:
            event = EventService.update_event(event_id, update_data)
            return event
        except ValueError as e:
            abort(400, message=str(e))

    @blp.response(204)
    @blp.doc(
        summary="Delete event (org owner only)",
        description="Soft deletes an event, clearing sensitive data but preserving it for connection history",
        responses={
            403: {"description": "Must be organization owner to delete events"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @org_owner_required()
    def delete(self, event_id):
        """Soft delete event - org owner only"""
        EventService.delete_event(event_id)
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
        return EventService.update_event_branding(event_id, branding_data)
