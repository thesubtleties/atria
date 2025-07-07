from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required
from flask import request

from api.api.schemas.sponsor import (
    SponsorSchema,
    SponsorDetailSchema,
    SponsorCreateSchema,
    SponsorUpdateSchema,
    SponsorListSchema,
    SponsorTierSchema,
    SponsorReorderSchema,
)
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
)
from api.services.sponsor import SponsorService


blp = Blueprint(
    "sponsors",
    "sponsors",
    url_prefix="/api",
    description="Operations on event sponsors",
)


@blp.route("/events/<int:event_id>/sponsors")
class SponsorList(MethodView):
    @jwt_required()
    @event_member_required()
    @blp.response(200)
    @blp.doc(
        summary="List event sponsors",
        description="Get all sponsors for an event (requires event membership)",
        parameters=[
            {
                "in": "path",
                "name": "event_id",
                "schema": {"type": "integer"},
                "required": True,
                "example": 123,
            },
            {
                "in": "query",
                "name": "active_only",
                "schema": {"type": "boolean"},
                "description": "Only show active sponsors",
                "default": True,
            },
        ],
    )
    def get(self, event_id):
        """Get event's sponsors - requires event membership"""
        active_only = request.args.get("active_only", True, type=bool)
        
        return SponsorService.get_event_sponsors(
            event_id, active_only, SponsorListSchema()
        )

    @blp.arguments(SponsorCreateSchema)
    @blp.response(201, SponsorDetailSchema)
    @blp.doc(
        summary="Create new sponsor",
        description="Create a new sponsor for the event",
        responses={
            400: {"description": "Validation error"},
            403: {"description": "Not authorized"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, sponsor_data, event_id):
        """Create a new sponsor"""
        sponsor = SponsorService.create_sponsor(event_id, sponsor_data)
        return SponsorDetailSchema().dump(sponsor)


@blp.route("/sponsors/<int:sponsor_id>")
class SponsorDetail(MethodView):
    @jwt_required()
    @blp.response(200, SponsorDetailSchema)
    @blp.doc(
        summary="Get sponsor details",
        description="Get detailed information about a sponsor (requires event membership)",
    )
    def get(self, sponsor_id):
        """Get sponsor details - requires event membership"""
        sponsor = SponsorService.get_sponsor(sponsor_id)
        
        # Check if user is a member of the sponsor's event
        from flask_jwt_extended import get_jwt_identity
        from api.models import User, Event
        
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)
        event = Event.query.get_or_404(sponsor.event_id)
        
        if not event.get_user_role(current_user):
            return {"message": "Not authorized to view this sponsor"}, 403
            
        return SponsorDetailSchema().dump(sponsor)

    @blp.arguments(SponsorUpdateSchema)
    @blp.response(200, SponsorDetailSchema)
    @blp.doc(
        summary="Update sponsor",
        description="Update sponsor information",
        responses={
            400: {"description": "Validation error"},
            403: {"description": "Not authorized"},
            404: {"description": "Sponsor not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def patch(self, sponsor_data, sponsor_id):
        """Update sponsor information"""
        # Get sponsor to check event_id for decorator
        sponsor = SponsorService.get_sponsor(sponsor_id)
        kwargs = {"event_id": sponsor.event_id}
        
        # Check authorization
        if not self._check_event_organizer_auth(kwargs):
            return {"message": "Not authorized to update this sponsor"}, 403
        
        updated_sponsor = SponsorService.update_sponsor(sponsor_id, sponsor_data)
        return SponsorDetailSchema().dump(updated_sponsor)

    @blp.response(204)
    @blp.doc(
        summary="Delete sponsor",
        description="Delete a sponsor from the event",
        responses={
            403: {"description": "Not authorized"},
            404: {"description": "Sponsor not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def delete(self, sponsor_id):
        """Delete a sponsor"""
        # Get sponsor to check event_id for decorator
        sponsor = SponsorService.get_sponsor(sponsor_id)
        kwargs = {"event_id": sponsor.event_id}
        
        # Check authorization
        if not self._check_event_organizer_auth(kwargs):
            return {"message": "Not authorized to delete this sponsor"}, 403
        
        SponsorService.delete_sponsor(sponsor_id)
        return "", 204

    def _check_event_organizer_auth(self, kwargs):
        """Helper to check event organizer authorization"""
        from flask_jwt_extended import get_jwt_identity
        from api.models import User, Event
        from api.models.enums import EventUserRole
        
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)
        event = Event.query.get_or_404(kwargs["event_id"])
        
        user_role = event.get_user_role(current_user)
        return user_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]


@blp.route("/events/<int:event_id>/sponsors/featured")
class FeaturedSponsorsList(MethodView):
    @jwt_required()
    @event_member_required()
    @blp.response(200)
    @blp.doc(
        summary="List featured sponsors",
        description="Get featured sponsors for an event (requires event membership)",
    )
    def get(self, event_id):
        """Get featured sponsors - requires event membership"""
        sponsors = SponsorService.get_featured_sponsors(event_id)
        return SponsorListSchema().dump(sponsors, many=True)


@blp.route("/sponsors/<int:sponsor_id>/toggle-active")
class SponsorToggleActive(MethodView):
    @blp.response(200, SponsorDetailSchema)
    @blp.doc(
        summary="Toggle sponsor active status",
        description="Toggle whether a sponsor is active or inactive",
        responses={
            403: {"description": "Not authorized"},
            404: {"description": "Sponsor not found"},
        },
    )
    @jwt_required()
    def post(self, sponsor_id):
        """Toggle sponsor active status"""
        # Get sponsor to check authorization
        sponsor = SponsorService.get_sponsor(sponsor_id)
        
        # Manual auth check
        from flask_jwt_extended import get_jwt_identity
        from api.models import User, Event
        from api.models.enums import EventUserRole
        
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)
        event = Event.query.get_or_404(sponsor.event_id)
        
        user_role = event.get_user_role(current_user)
        if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            return {"message": "Not authorized to update this sponsor"}, 403
        
        updated_sponsor = SponsorService.toggle_sponsor_active(sponsor_id)
        return SponsorDetailSchema().dump(updated_sponsor)


@blp.route("/sponsors/<int:sponsor_id>/toggle-featured")
class SponsorToggleFeatured(MethodView):
    @blp.response(200, SponsorDetailSchema)
    @blp.doc(
        summary="Toggle sponsor featured status",
        description="Toggle whether a sponsor is featured",
        responses={
            403: {"description": "Not authorized"},
            404: {"description": "Sponsor not found"},
        },
    )
    @jwt_required()
    def post(self, sponsor_id):
        """Toggle sponsor featured status"""
        # Get sponsor to check authorization
        sponsor = SponsorService.get_sponsor(sponsor_id)
        
        # Manual auth check
        from flask_jwt_extended import get_jwt_identity
        from api.models import User, Event
        from api.models.enums import EventUserRole
        
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)
        event = Event.query.get_or_404(sponsor.event_id)
        
        user_role = event.get_user_role(current_user)
        if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            return {"message": "Not authorized to update this sponsor"}, 403
        
        updated_sponsor = SponsorService.toggle_sponsor_featured(sponsor_id)
        return SponsorDetailSchema().dump(updated_sponsor)


@blp.route("/events/<int:event_id>/sponsors/reorder")
class SponsorReorder(MethodView):
    @blp.arguments(SponsorReorderSchema)
    @blp.response(200)
    @blp.doc(
        summary="Reorder sponsors",
        description="Update display order for multiple sponsors",
        responses={
            403: {"description": "Not authorized"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, data, event_id):
        """Reorder sponsors"""
        sponsors = SponsorService.reorder_sponsors(event_id, data["sponsor_orders"])
        return SponsorListSchema().dump(sponsors, many=True)


@blp.route("/events/<int:event_id>/sponsor-tiers")
class SponsorTiers(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Get sponsor tiers",
        description="Get sponsor tier configuration for an event",
    )
    @jwt_required()
    @event_member_required()
    def get(self, event_id):
        """Get sponsor tiers"""
        from api.models import Event
        
        event = Event.query.get_or_404(event_id)
        return SponsorTierSchema().dump(event.sponsor_tiers or [], many=True)

    @blp.arguments(SponsorTierSchema)
    @blp.response(200)
    @blp.doc(
        summary="Update sponsor tiers",
        description="Update sponsor tier configuration for an event",
        responses={
            400: {"description": "Validation error"},
            403: {"description": "Not authorized"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def put(self, tiers, event_id):
        """Update sponsor tiers"""
        updated_tiers = SponsorService.update_sponsor_tiers(event_id, tiers)
        return SponsorTierSchema().dump(updated_tiers, many=True)