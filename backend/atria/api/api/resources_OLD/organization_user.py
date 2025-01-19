from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
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


class OrganizationUserList(Resource):
    """
    Organization user list operations
    ---
    get:
      tags:
        - organization-users
      summary: List organization users
      parameters:
        - in: path
          name: org_id
          schema:
            type: integer
          required: true
          description: Organization ID
        - in: query
          name: role
          schema:
            type: string
          description: Filter by role (optional)
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items: OrganizationUserSchema
        403:
          description: Not authorized to view organization users

    post:
      tags:
        - organization-users
      summary: Add user to organization
      parameters:
        - in: path
          name: org_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: OrganizationUserCreateSchema
      responses:
        201:
          content:
            application/json:
              schema: OrganizationUserDetailSchema
        403:
          description: Not authorized to add users
        404:
          description: User not found
        400:
          description: User already in organization
    """

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

    @jwt_required()
    @org_admin_required()
    def post(self, org_id):
        """Add user to organization"""
        # Validate and load data
        schema = OrganizationUserCreateSchema()
        data = schema.load(request.json)

        # Get user to add
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

        return OrganizationUserDetailSchema().dump(org_user), 201


class OrganizationUserDetail(Resource):
    """
    Single organization user operations
    ---
    put:
      tags:
        - organization-users
      summary: Update user role
      parameters:
        - in: path
          name: org_id
          schema:
            type: integer
          required: true
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: OrganizationUserUpdateSchema
      responses:
        200:
          content:
            application/json:
              schema: OrganizationUserDetailSchema
        403:
          description: Not authorized to update role

    delete:
      tags:
        - organization-users
      summary: Remove user from organization
      parameters:
        - in: path
          name: org_id
          schema:
            type: integer
          required: true
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
      responses:
        200:
          description: User removed from organization
        403:
          description: Not authorized to remove user
    """

    @jwt_required()
    @org_admin_required()
    def put(self, org_id, user_id):
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

        # Get the role from request body
        schema = OrganizationUserUpdateSchema()
        data = schema.load(request.json)

        # Find the organization-user relationship record
        org_user = OrganizationUser.query.filter_by(
            organization_id=org_id, user_id=user_id
        ).first_or_404()

        # Update the role
        org_user.update_role(data["role"])
        db.session.commit()

        return OrganizationUserDetailSchema().dump(org_user)

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
