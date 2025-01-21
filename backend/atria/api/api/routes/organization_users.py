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
    AddUserToOrgSchema,
)
from api.commons.pagination import (
    paginate,
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.commons.decorators import org_admin_required, org_member_required


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
                "enum": [
                    role.value for role in OrganizationUserRole
                ],  # Dynamic from enum
            },
            *PAGINATION_PARAMETERS,  # imported from pagination helper
        ],
        responses={
            200: get_pagination_schema(
                "organization_users", "OrganizationUserBase"
            ),  # imported from pagination helper
            403: {"description": "Not authorized to view organization users"},
            404: {"description": "Organization not found"},
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

    @blp.arguments(AddUserToOrgSchema)  # Just user fields, no role
    @blp.response(201, OrganizationUserDetailSchema)
    @jwt_required()
    @org_admin_required()
    def post(self, user_data, org_id):
        """Add user to organization"""
        org = Organization.query.get_or_404(org_id)

        # Get or create user
        user = User.query.filter_by(email=user_data["email"]).first()
        if not user:
            # Create new user
            user = User(
                email=user_data["email"],
                password=user_data.get("password", "changeme"),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()  # Get user.id without committing

        # Check if already in org
        if org.has_user(user):
            return {"message": "User already in organization"}, 409

        # Get role from request
        role = request.json.get(
            "role", "MEMBER"
        )  # Default to MEMBER if not specified

        # Add user to organization with role
        org.add_user(user, OrganizationUserRole(role))
        db.session.commit()

        # Get the new organization user record
        org_user = OrganizationUser.query.filter_by(
            organization_id=org_id, user_id=user.id
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
