from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.extensions import db
from api.models import (
    Organization,
    User,
    OrganizationUser,
    OrganizationUserRole,
)
from api.api.schemas import (
    OrganizationUserSchema,
    OrganizationUserDetailSchema,
    OrganizationUserCreateSchema,
    OrganizationUserUpdateSchema,
)


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
    def get(self, org_id):
        """Get list of organization users"""
        # Permission check
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)
        org = Organization.query.get_or_404(org_id)

        # Must be member to view users
        if not org.has_user(current_user):
            return {"message": "Not a member of this organization"}, 403

        # Get organization users with optional role filter
        role = request.args.get("role")
        query = OrganizationUser.query.filter_by(organization_id=org_id)

        if role:
            query = query.filter_by(role=role)

        org_users = query.order_by(OrganizationUser.created_at).all()
        return OrganizationUserSchema(many=True).dump(org_users)

    @jwt_required()
    def post(self, org_id):
        """Add user to organization"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)
        org = Organization.query.get_or_404(org_id)

        # Must be admin/owner to add users
        if not current_user.is_org_admin(org_id):
            return {"message": "Must be admin to add users"}, 403

        # Validate and load data
        schema = OrganizationUserCreateSchema()
        data = schema.load(request.json)

        # Get user to add
        new_user = User.query.get_or_404(data["user_id"])

        # Check if already in org
        if org.has_user(new_user):
            return {"message": "User already in organization"}, 400

        # Add user with specified role
        org.add_user(new_user, data["role"])
        db.session.commit()

        return (
            OrganizationUserDetailSchema().dump(
                OrganizationUser.query.filter_by(
                    organization_id=org_id, user_id=new_user.id
                ).first()
            ),
            201,
        )


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
    def put(self, org_id, user_id):
        """Update user's role in organization"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)
        org = Organization.query.get_or_404(org_id)
        # Remove this line since we don't use it:
        # target_user = User.query.get_or_404(user_id)

        # Must be admin/owner to change roles
        if not current_user.is_org_admin(org_id):
            return {"message": "Must be admin to update roles"}, 403

        # Can't change own role if you're the last owner
        if (
            current_user_id == user_id
            and org.get_user_role(current_user) == OrganizationUserRole.OWNER
            and org.owner_count == 1
        ):
            return {"message": "Cannot change role of last owner"}, 400

        # Get the role from request body using our schema
        schema = OrganizationUserUpdateSchema()
        data = schema.load(request.json)  # Validates the incoming JSON

        # Find the organization-user relationship record
        org_user = OrganizationUser.query.filter_by(
            organization_id=org_id, user_id=user_id
        ).first_or_404()

        # Update the role using our model method
        org_user.update_role(data["role"])
        db.session.commit()

        # Return detailed view of the updated record
        return OrganizationUserDetailSchema().dump(org_user)

    @jwt_required()
    def delete(self, org_id, user_id):
        """Remove user from organization"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)
        org = Organization.query.get_or_404(org_id)
        target_user = User.query.get_or_404(user_id)

        # Must be admin/owner to remove users
        if not current_user.is_org_admin(org_id):
            return {"message": "Must be admin to remove users"}, 403

        # Can't remove self if last owner
        if (
            current_user_id == user_id
            and org.get_user_role(current_user) == OrganizationUserRole.OWNER
            and org.owner_count == 1
        ):
            return {"message": "Cannot remove last owner"}, 400

        # Remove user
        org.remove_user(target_user)
        db.session.commit()

        return {"message": "User removed from organization"}
