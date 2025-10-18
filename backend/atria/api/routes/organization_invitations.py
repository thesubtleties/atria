from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required
from api.models.enums import OrganizationUserRole
from api.schemas import (
    OrganizationInvitationSchema,
    OrganizationInvitationDetailSchema,
    OrganizationInvitationCreateSchema,
    BulkOrganizationInvitationCreateSchema,
    OrganizationInvitationAcceptSchema,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
    paginate,
)
from api.commons.decorators import (
    org_admin_required,
)
from api.services.organization_invitation import OrganizationInvitationService


blp = Blueprint(
    "organization_invitations",
    "organization_invitations",
    url_prefix="/api",
    description="Operations on organization invitations",
)


@blp.route("/organizations/<int:org_id>/invitations")
class OrganizationInvitationList(MethodView):
    @jwt_required()
    @org_admin_required()
    @blp.response(200)
    @blp.doc(
        summary="List pending invitations",
        description="Get all pending invitations for an organization",
        parameters=[
            {
                "in": "path",
                "name": "org_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Organization ID",
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("invitations", "OrganizationInvitationBase"),
            403: {"description": "Not authorized to view invitations"},
            404: {"description": "Organization not found"},
        },
    )
    def get(self, org_id):
        """Get pending invitations for organization"""
        query = OrganizationInvitationService.get_pending_invitations_query(org_id)
        return paginate(query, OrganizationInvitationDetailSchema(many=True), collection_name="invitations")

    @jwt_required()
    @org_admin_required()
    @blp.arguments(OrganizationInvitationCreateSchema)
    @blp.response(201, OrganizationInvitationDetailSchema)
    @blp.doc(
        summary="Send organization invitation",
        description="Send an invitation to join the organization",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "examples": {
                            "already_in_org": {
                                "value": {"message": "User already in organization"}
                            },
                            "already_invited": {
                                "value": {"message": "Invitation already sent to this email"}
                            },
                        }
                    }
                },
            },
            403: {"description": "Not authorized to send invitations"},
            404: {"description": "Organization not found"},
        },
    )
    def post(self, data, org_id):
        """Send invitation to join organization"""
        try:
            invitation = OrganizationInvitationService.invite_user_to_organization(
                org_id=org_id,
                email=data["email"],
                role=data["role"],
                message=data.get("message")
            )
            return invitation, 201
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/organizations/<int:org_id>/invitations/bulk")
class BulkOrganizationInvitation(MethodView):
    @jwt_required()
    @org_admin_required()
    @blp.arguments(BulkOrganizationInvitationCreateSchema)
    @blp.response(201)
    @blp.doc(
        summary="Bulk send organization invitations",
        description="Send multiple invitations at once",
        responses={
            403: {"description": "Not authorized to send invitations"},
            404: {"description": "Organization not found"},
        },
    )
    def post(self, data, org_id):
        """Bulk send organization invitations"""
        return OrganizationInvitationService.bulk_invite_users(
            org_id=org_id,
            invitations=data["invitations"]
        ), 201


@blp.route("/invitations/organization/<string:token>")
class OrganizationInvitationDetail(MethodView):
    @blp.response(200, OrganizationInvitationDetailSchema)
    @blp.doc(
        summary="Get invitation details",
        description="Get details of an invitation by token",
        responses={
            404: {"description": "Invitation not found"},
        },
    )
    def get(self, token):
        """Get invitation details by token"""
        return OrganizationInvitationService.get_invitation_by_token(token)


@blp.route("/invitations/organization/<string:token>/accept")
class AcceptOrganizationInvitation(MethodView):
    @jwt_required()
    @blp.arguments(OrganizationInvitationAcceptSchema)
    @blp.response(200)
    @blp.doc(
        summary="Accept organization invitation",
        description="Accept an invitation to join an organization",
        responses={
            400: {
                "description": "Validation error",
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
                                "value": {"message": "User already in organization"}
                            },
                        }
                    }
                },
            },
            404: {"description": "Invitation not found"},
        },
    )
    def post(self, data, token):
        """Accept organization invitation"""
        try:
            org_user = OrganizationInvitationService.accept_invitation(token)
            return {"message": "Invitation accepted successfully", "organization_id": org_user.organization_id}
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/invitations/organization/<string:token>/decline")
class DeclineOrganizationInvitation(MethodView):
    @jwt_required()
    @blp.response(200)
    @blp.doc(
        summary="Decline organization invitation",
        description="Decline an invitation to join an organization",
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
        """Decline organization invitation"""
        try:
            OrganizationInvitationService.decline_invitation(token)
            return {"message": "Invitation declined"}
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/organizations/<int:org_id>/invitations/<int:invitation_id>")
class CancelOrganizationInvitation(MethodView):
    @jwt_required()
    @org_admin_required()
    @blp.response(200)
    @blp.doc(
        summary="Cancel organization invitation",
        description="Cancel a pending invitation",
        responses={
            400: {"description": "Can only cancel pending invitations"},
            403: {"description": "Must be admin or owner to cancel invitations"},
            404: {"description": "Invitation not found"},
        },
    )
    def delete(self, org_id, invitation_id):
        """Cancel organization invitation"""
        try:
            OrganizationInvitationService.cancel_invitation(invitation_id)
            return {"message": "Invitation cancelled"}
        except ValueError as e:
            abort(400, message=str(e))