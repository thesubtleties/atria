# api/api/routes/organization_users.py
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.models.enums import OrganizationUserRole
from api.api.schemas import (
    OrganizationUserSchema,
    OrganizationUserDetailSchema,
    OrganizationUserUpdateSchema,
    AddUserToOrgSchema,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.commons.decorators import org_admin_required, org_member_required
from api.services.organization_user import OrganizationUserService


blp = Blueprint(
    "organization_users",
    "organization_users",
    url_prefix="/api",
    description="Operations on organization users",
)


@blp.route("/organizations/<int:org_id>/users")
class OrganizationUserList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List organization users",
        parameters=[
            {
                "in": "path",
                "name": "org_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Organization ID",
            },
            {
                "in": "query",
                "name": "role",
                "schema": {"type": "string"},
                "description": "Filter by role (optional)",
                "enum": [role.value for role in OrganizationUserRole],
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema(
                "organization_users", "OrganizationUserBase"
            ),
            403: {"description": "Not authorized to view organization users"},
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_member_required()
    def get(self, org_id):
        """Get list of organization users"""
        # Get role filter if provided
        role = request.args.get("role")

        return OrganizationUserService.get_organization_users(
            org_id, role, OrganizationUserSchema(many=True)
        )

    @blp.arguments(AddUserToOrgSchema)
    @blp.response(201, OrganizationUserDetailSchema)
    @jwt_required()
    @org_admin_required()
    def post(self, user_data, org_id):
        """Add user to organization"""
        admin_id = int(get_jwt_identity())

        try:
            org_user = OrganizationUserService.add_user_to_organization(
                org_id, user_data, admin_id
            )
            return org_user, 201
        except ValueError as e:
            abort(409, message=str(e))


@blp.route("/organizations/<int:org_id>/users/<int:user_id>")
class OrganizationUserDetail(MethodView):
    @blp.arguments(OrganizationUserUpdateSchema)
    @blp.response(200, OrganizationUserDetailSchema)
    @blp.doc(
        summary="Update user role",
        responses={
            400: {"description": "Cannot change role of last owner"},
            403: {"description": "Not authorized to update role"},
        },
    )
    @jwt_required()
    @org_admin_required()
    def put(self, update_data, org_id, user_id):
        """Update user's role in organization"""
        admin_id = int(get_jwt_identity())

        try:
            org_user = OrganizationUserService.update_user_role(
                org_id, user_id, update_data["role"], admin_id
            )
            return org_user
        except ValueError as e:
            abort(400, message=str(e))

    @blp.response(200)
    @blp.doc(
        summary="Remove user from organization",
        responses={
            400: {"description": "Cannot remove last owner"},
            403: {"description": "Not authorized to remove user"},
        },
    )
    @jwt_required()
    @org_admin_required()
    def delete(self, org_id, user_id):
        """Remove user from organization"""
        admin_id = int(get_jwt_identity())

        try:
            OrganizationUserService.remove_user_from_organization(
                org_id, user_id, admin_id
            )
            return {"message": "User removed from organization"}
        except ValueError as e:
            abort(400, message=str(e))
