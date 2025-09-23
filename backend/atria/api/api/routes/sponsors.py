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
    @blp.response(200, SponsorListSchema(many=True))
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
        try:
            # Frontend sends 0 or 1 which works with type=int
            active_only = request.args.get("active_only", 1, type=int)

            # Don't pass schema since decorator handles serialization
            return SponsorService.get_event_sponsors(
                event_id, bool(active_only)
            )
        except Exception as e:
            return {"message": f"Failed to get sponsors: {str(e)}"}, 500

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
        return sponsor, 201  # Let @blp.response decorator handle serialization


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

        return sponsor  # Let @blp.response decorator handle serialization

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
    def patch(self, sponsor_data, sponsor_id):
        """Update sponsor information"""
        try:
            # Get sponsor to check event_id for authorization
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
                return {
                    "message": "Not authorized to update this sponsor"
                }, 403

            updated_sponsor = SponsorService.update_sponsor(
                sponsor_id, sponsor_data
            )
            return updated_sponsor  # Let @blp.response decorator handle serialization
        except Exception as e:
            # Return error with proper status code
            return {"message": f"Failed to update sponsor: {str(e)}"}, 500

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
    def delete(self, sponsor_id):
        """Delete a sponsor"""
        try:
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
                return {
                    "message": "Not authorized to delete this sponsor"
                }, 403

            SponsorService.delete_sponsor(sponsor_id)
            return "", 204
        except Exception as e:
            return {"message": f"Failed to delete sponsor: {str(e)}"}, 500


@blp.route("/events/<int:event_id>/sponsors/featured")
class FeaturedSponsorsList(MethodView):
    @jwt_required()
    @event_member_required()
    @blp.response(200, SponsorListSchema(many=True))
    @blp.doc(
        summary="List featured sponsors",
        description="Get featured sponsors for an event (requires event membership)",
    )
    def get(self, event_id):
        """Get featured sponsors - requires event membership"""
        sponsors = SponsorService.get_featured_sponsors(event_id)
        return sponsors  # Let @blp.response decorator handle serialization


@blp.route("/sponsors/<int:sponsor_id>/toggle-active")
class SponsorToggleActive(MethodView):
    @jwt_required()
    @blp.response(200)
    @blp.doc(
        summary="Toggle sponsor active status",
        description="Toggle whether a sponsor is active or inactive",
        responses={
            403: {"description": "Not authorized"},
            404: {"description": "Sponsor not found"},
        },
    )
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
        # Return minimal response since frontend will refetch the list
        return {"success": True, "id": sponsor_id}, 200


@blp.route("/sponsors/<int:sponsor_id>/toggle-featured")
class SponsorToggleFeatured(MethodView):
    @jwt_required()
    @blp.response(200)
    @blp.doc(
        summary="Toggle sponsor featured status",
        description="Toggle whether a sponsor is featured",
        responses={
            403: {"description": "Not authorized"},
            404: {"description": "Sponsor not found"},
        },
    )
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
        # Return minimal response since frontend will refetch the list
        return {"success": True, "id": sponsor_id}, 200


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

    @blp.arguments(SponsorTierSchema(many=True))
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
