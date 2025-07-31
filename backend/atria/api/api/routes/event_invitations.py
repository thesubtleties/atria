from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required
from api.models.enums import EventUserRole
from api.api.schemas import (
    EventInvitationSchema,
    EventInvitationDetailSchema,
    EventInvitationCreateSchema,
    BulkEventInvitationCreateSchema,
    EventInvitationAcceptSchema,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
    paginate,
)
from api.commons.decorators import (
    event_organizer_required,
    event_admin_required,
)
from api.services.event_invitation import EventInvitationService


blp = Blueprint(
    "event_invitations",
    "event_invitations",
    url_prefix="/api",
    description="Operations on event invitations",
)


@blp.route("/events/<int:event_id>/invitations")
class EventInvitationList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List pending invitations",
        description="Get all pending invitations for an event",
        parameters=[
            {
                "in": "path",
                "name": "event_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Event ID",
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("invitations", "EventInvitationBase"),
            403: {"description": "Not authorized to view invitations"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def get(self, event_id):
        """Get pending invitations for event"""
        query = EventInvitationService.get_pending_invitations_query(event_id)
        return paginate(query, EventInvitationDetailSchema(many=True), collection_name="invitations")

    @blp.arguments(EventInvitationCreateSchema)
    @blp.response(201, EventInvitationDetailSchema)
    @blp.doc(
        summary="Send event invitation",
        description="Send an invitation to join the event",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "examples": {
                            "already_in_event": {
                                "value": {"message": "User already in event"}
                            },
                            "already_invited": {
                                "value": {"message": "Invitation already sent to this email"}
                            },
                        }
                    }
                },
            },
            403: {"description": "Not authorized to send invitations"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, data, event_id):
        """Send invitation to join event"""
        try:
            invitation = EventInvitationService.invite_user_to_event(
                event_id=event_id,
                email=data["email"],
                role=data["role"],
                message=data.get("message")
            )
            return invitation, 201
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/events/<int:event_id>/invitations/bulk")
class BulkEventInvitation(MethodView):
    @blp.arguments(BulkEventInvitationCreateSchema)
    @blp.response(200)
    @blp.doc(
        summary="Send bulk invitations",
        description="Send multiple invitations at once",
        responses={
            200: {
                "description": "Bulk invitation results",
                "content": {
                    "application/json": {
                        "example": {
                            "successful": [
                                {"email": "user1@example.com", "invitation_id": 1},
                                {"email": "user2@example.com", "invitation_id": 2}
                            ],
                            "failed": [
                                {"email": "user3@example.com", "error": "User already in event"}
                            ]
                        }
                    }
                },
            },
            403: {"description": "Not authorized to send invitations"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, data, event_id):
        """Send bulk invitations"""
        results = EventInvitationService.bulk_invite_users(
            event_id=event_id,
            invitations=data["invitations"]
        )
        return results


@blp.route("/invitations/event/<string:token>")
class EventInvitationDetail(MethodView):
    @blp.response(200, EventInvitationDetailSchema)
    @blp.doc(
        summary="Get invitation details",
        description="Get details of an invitation by token",
        responses={
            404: {"description": "Invitation not found"},
        },
    )
    def get(self, token):
        """Get invitation details by token"""
        return EventInvitationService.get_invitation_by_token(token)


@blp.route("/invitations/<string:token>/accept")
class AcceptInvitation(MethodView):
    @blp.arguments(EventInvitationAcceptSchema)
    @blp.response(200)
    @blp.doc(
        summary="Accept invitation",
        description="Accept an invitation to join an event",
        parameters=[
            {
                "in": "path",
                "name": "token",
                "schema": {"type": "string"},
                "required": True,
                "description": "Invitation token",
            }
        ],
        responses={
            200: {
                "description": "Invitation accepted successfully",
                "content": {
                    "application/json": {
                        "example": {"message": "Successfully joined event"}
                    }
                },
            },
            400: {
                "description": "Invalid invitation",
                "content": {
                    "application/json": {
                        "examples": {
                            "expired": {
                                "value": {"message": "Invitation has expired"}
                            },
                            "wrong_email": {
                                "value": {"message": "This invitation is for a different email address"}
                            },
                            "already_member": {
                                "value": {"message": "You are already a member of this event"}
                            },
                        }
                    }
                },
            },
            404: {"description": "Invitation not found"},
        },
    )
    @jwt_required()
    def post(self, data, token):
        """Accept invitation"""
        try:
            event_user = EventInvitationService.accept_invitation(token)
            return {"message": "Successfully joined event", "event_user_id": event_user.id}
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/invitations/<string:token>/decline")
class DeclineEventInvitation(MethodView):
    @jwt_required()
    @blp.response(200)
    @blp.doc(
        summary="Decline event invitation",
        description="Decline an invitation to join an event",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "examples": {
                            "wrong_email": {
                                "value": {"message": "This invitation is for a different email address"}
                            },
                        }
                    }
                },
            },
            404: {"description": "Invitation not found"},
        },
    )
    def post(self, token):
        """Decline event invitation"""
        try:
            EventInvitationService.decline_invitation(token)
            return {"message": "Invitation declined"}
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/invitations/<int:invitation_id>")
class InvitationDetail(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Cancel invitation",
        description="Cancel a pending invitation",
        responses={
            200: {
                "description": "Invitation cancelled",
                "content": {
                    "application/json": {
                        "example": {"message": "Invitation cancelled"}
                    }
                },
            },
            400: {
                "description": "Cannot cancel",
                "content": {
                    "application/json": {
                        "example": {"message": "Can only cancel pending invitations"}
                    }
                },
            },
            403: {"description": "Not authorized to cancel invitation"},
            404: {"description": "Invitation not found"},
        },
    )
    @jwt_required()
    def delete(self, invitation_id):
        """Cancel invitation"""
        try:
            EventInvitationService.cancel_invitation(invitation_id)
            return {"message": "Invitation cancelled"}
        except ValueError as e:
            abort(400, message=str(e))