# api/api/routes/organizations.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.api.schemas import (
    OrganizationSchema,
    OrganizationDetailSchema,
    OrganizationCreateSchema,
    OrganizationUpdateSchema,
)
from api.commons.decorators import org_admin_required, org_member_required
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.services.organization import OrganizationService


blp = Blueprint(
    "organizations",
    "organizations",
    url_prefix="/api",
    description="Operations on organizations",
)


@blp.route("/organizations/<int:org_id>")
class OrganizationResource(MethodView):
    @blp.response(200, OrganizationDetailSchema)
    @jwt_required()
    @org_member_required()
    @blp.doc(
        summary="Get organization details",
        responses={
            403: {"description": "Not authorized to view this organization"},
            404: {"description": "Organization not found"},
        },
    )
    def get(self, org_id):
        """Get organization details"""
        return OrganizationService.get_organization(org_id)

    @blp.arguments(OrganizationUpdateSchema)
    @blp.response(200, OrganizationDetailSchema)
    @blp.doc(
        summary="Update organization",
        responses={
            403: {"description": "Not authorized to update organization"},
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_admin_required()
    def put(self, update_data, org_id):
        """Update organization"""
        user_id = int(get_jwt_identity())

        try:
            return OrganizationService.update_organization(
                org_id, user_id, update_data
            )
        except ValueError as e:
            return {"message": str(e)}, 403

    @blp.response(204)
    @blp.doc(
        summary="Delete organization",
        responses={
            403: {"description": "Must be owner to delete organization"},
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    def delete(self, org_id):
        """Delete organization"""
        user_id = int(get_jwt_identity())

        try:
            OrganizationService.delete_organization(org_id, user_id)
            return "", 204
        except ValueError as e:
            return {"message": str(e)}, 403


@blp.route("/organizations")
class OrganizationList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List user's organizations",
        description="Get all organizations user belongs to",
        parameters=[
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("organizations", "OrganizationBase"),
            401: {"description": "Not authenticated"},
            403: {"description": "Not authorized"},
        },
    )
    @jwt_required()
    def get(self):
        """Get list of organizations user belongs to"""
        user_id = int(get_jwt_identity())

        return OrganizationService.get_user_organizations(
            user_id, OrganizationSchema(many=True)
        )

    @blp.arguments(OrganizationCreateSchema)
    @blp.response(201, OrganizationDetailSchema)
    @blp.doc(
        summary="Create new organization",
        responses={
            400: {"description": "Validation error"},
        },
    )
    @jwt_required()
    def post(self, org_data):
        """Create new organization"""
        user_id = int(get_jwt_identity())

        org = OrganizationService.create_organization(
            org_data["name"], user_id
        )
        return org, 201
