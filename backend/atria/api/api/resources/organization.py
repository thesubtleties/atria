from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.extensions import db
from api.models import Organization, User
from api.models.enums import OrganizationUserRole
from api.api.schemas import (
    OrganizationSchema,
    OrganizationDetailSchema,
    OrganizationCreateSchema,
    OrganizationUpdateSchema,
)


class OrganizationResource(Resource):
    """
    Single organization operations
    ---
    get:
      tags:
        - organizations
      summary: Get organization details
      parameters:
        - in: path
          name: org_id
          schema:
            type: integer
          required: true
          description: Organization ID
      responses:
        200:
          content:
            application/json:
              schema: OrganizationDetailSchema
        404:
          description: Organization not found

    put:
      tags:
        - organizations
      summary: Update organization
      parameters:
        - in: path
          name: org_id
          schema:
            type: integer
          required: true
      requestBody:
        content:
          application/json:
            schema: OrganizationUpdateSchema
      responses:
        200:
          content:
            application/json:
              schema: OrganizationDetailSchema
        403:
          description: Not authorized to update organization

    delete:
      tags:
        - organizations
      summary: Delete organization
      parameters:
        - in: path
          name: org_id
          schema:
            type: integer
          required: true
      responses:
        200:
          description: Organization deleted
        403:
          description: Not authorized to delete organization
    """

    @jwt_required()
    def get(self, org_id):
        """Get organization details"""
        # Get current user for permission check
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)

        # Get organization
        org = Organization.query.get_or_404(org_id)

        # Check if user is member of organization
        if not org.has_user(current_user):
            return {"message": "Not a member of this organization"}, 403

        # Return detailed organization info
        return OrganizationDetailSchema().dump(org)

    @jwt_required()
    def put(self, org_id):
        """Update organization"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)

        org = Organization.query.get_or_404(org_id)

        # Check if user is admin/owner
        if not current_user.is_org_admin(org_id):
            return {"message": "Must be admin to update organization"}, 403

        # Update organization
        org = OrganizationUpdateSchema().load(
            request.json, instance=org, partial=True
        )
        db.session.commit()

        return OrganizationDetailSchema().dump(org)

    @jwt_required()
    def delete(self, org_id):
        """Delete organization"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)

        org = Organization.query.get_or_404(org_id)

        # Only owners can delete organization
        if org.get_user_role(current_user) != OrganizationUserRole.OWNER:
            return {"message": "Must be owner to delete organization"}, 403

        db.session.delete(org)
        db.session.commit()

        return {"message": "Organization deleted successfully"}


class OrganizationList(Resource):
    """
    Organization list operations
    ---
    get:
      tags:
        - organizations
      summary: List user's organizations
      description: Get all organizations user belongs to
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items: OrganizationSchema

    post:
      tags:
        - organizations
      summary: Create new organization
      requestBody:
        content:
          application/json:
            schema: OrganizationCreateSchema
      responses:
        201:
          content:
            application/json:
              schema: OrganizationDetailSchema
    """

    @jwt_required()
    def get(self):
        """Get list of organizations user belongs to"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)

        # Return all organizations user is member of
        return OrganizationSchema(many=True).dump(current_user.organizations)

    @jwt_required()
    def post(self):
        """Create new organization"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)

        # Create organization
        schema = OrganizationCreateSchema()
        data = schema.load(request.json)

        org = Organization(**data)
        db.session.add(org)
        db.session.flush()  # Get org ID before adding user

        # Add current user as owner
        org.add_user(current_user, OrganizationUserRole.OWNER)

        db.session.commit()

        return OrganizationDetailSchema().dump(org), 201
