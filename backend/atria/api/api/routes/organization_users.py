# api/api/routes/organization_users.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.extensions import db
from api.models import (
    Organization,
    User,
    OrganizationUser,
)
from api.models.enums import OrganizationUserRole
from api.api.schemas import (
    OrganizationUserSchema,
    OrganizationUserDetailSchema,
    OrganizationUserCreateSchema,
    OrganizationUserUpdateSchema,
)
from api.commons.pagination import paginate
from api.commons.decorators import org_admin_required, org_member_required
from api.api.schemas.pagination import create_paginated_schema

blp = Blueprint(
    "organization_users",
    "organization_users",
    url_prefix="/api",
    description="Operations on organization users",
)


@blp.route("/organizations/<int:org_id>/users")
class OrganizationUserList(MethodView):
    @blp.response(
        200,
        create_paginated_schema(OrganizationUserSchema, "organization_users"),
    )
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
            },
            {
                "in": "query",
                "name": "page",
                "schema": {"type": "integer"},
                "description": "Page number (default: 1)",
            },
            {
                "in": "query",
                "name": "per_page",
                "schema": {"type": "integer"},
                "description": "Items per page (default: 50)",
            },
        ],
        responses={
            403: {"description": "Not authorized to view organization users"},
        },
    )
    @jwt_required()
    @org_member_required()
    def get(self, org_id):
        """Get list of organization users"""
        # Build query
        query = OrganizationUser.query.filter_by(organization_id=org_id)

        # Apply role filter if provided
        role = request.args.get("role")
        if role:
            query = query.filter_by(role=role)

        # Order by created_at
        query = query.order_by(OrganizationUser.created_at)

        return paginate(
            query,
            OrganizationUserSchema(many=True),
            collection_name="organization_users",
        )

    @blp.arguments(OrganizationUserCreateSchema)
    @blp.response(201, OrganizationUserDetailSchema)
    @blp.doc(
        summary="Add user to organization",
        responses={
            400: {"description": "User already in organization"},
            403: {"description": "Not authorized to add users"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    @org_admin_required()
    def post(self, data, org_id):
        """Add user to organization"""
        # Validate and load data
        new_user = User.query.get_or_404(data["user_id"])
        org = Organization.query.get(org_id)

        # Check if already in org
        if org.has_user(new_user):
            return {"message": "User already in organization"}, 400

        # Add user with specified role
        org.add_user(new_user, data["role"])
        db.session.commit()

        # Get the new organization user record
        org_user = OrganizationUser.query.filter_by(
            organization_id=org_id, user_id=new_user.id
        ).first()

        return org_user, 201


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
        current_user_id = int(get_jwt_identity())
        org = Organization.query.get(org_id)

        # Can't change own role if you're the last owner
        if (
            current_user_id == user_id
            and org.get_user_role(User.query.get(current_user_id))
            == OrganizationUserRole.OWNER
            and org.owner_count == 1
        ):
            return {"message": "Cannot change role of last owner"}, 400

        # Find the organization-user relationship record
        org_user = OrganizationUser.query.filter_by(
            organization_id=org_id, user_id=user_id
        ).first_or_404()

        # Update the role
        org_user.update_role(update_data["role"])
        db.session.commit()

        return org_user

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
        current_user_id = int(get_jwt_identity())
        org = Organization.query.get(org_id)
        target_user = User.query.get_or_404(user_id)

        # Can't remove self if last owner
        if (
            current_user_id == user_id
            and org.get_user_role(User.query.get(current_user_id))
            == OrganizationUserRole.OWNER
            and org.owner_count == 1
        ):
            return {"message": "Cannot remove last owner"}, 400

        # Remove user
        org.remove_user(target_user)
        db.session.commit()

        return {"message": "User removed from organization"}
