from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.extensions import db
from api.models import Organization, User
from api.models.enums import OrganizationUserRole
from api.api.schemas import (
    OrganizationSchema,
    OrganizationDetailSchema,
    OrganizationCreateSchema,
    OrganizationUpdateSchema,
)
from api.commons.decorators import org_admin_required, org_member_required
from api.commons.pagination import (
    paginate,
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)


blp = Blueprint(
    "organizations",
    "organizations",
    url_prefix="/api",
    description="Operations on organizations",
)


@blp.route("/organizations/<int:org_id>")
class OrganizationResource(MethodView):
    @blp.response(200, OrganizationDetailSchema)
    @blp.doc(
        summary="Get organization details",
        responses={
            403: {"description": "Not authorized to view this organization"},
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_member_required()
    def get(self, org_id):
        """Get organization details"""
        org = Organization.query.get_or_404(org_id)
        return org

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
        org = Organization.query.get_or_404(org_id)

        for key, value in update_data.items():
            setattr(org, key, value)

        db.session.commit()
        return org

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
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)
        org = Organization.query.get_or_404(org_id)

        if org.get_user_role(current_user) != OrganizationUserRole.OWNER:
            return {"message": "Must be owner to delete organization"}, 403

        db.session.delete(org)
        db.session.commit()
        return ""


@blp.route("/organizations")
class OrganizationList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List user's organizations",
        description="Get all organizations user belongs to",
        parameters=[
            *PAGINATION_PARAMETERS,  # imported from pagination helper
        ],
        responses={
            200: get_pagination_schema(
                "organizations", "OrganizationBase"
            ),  # imported from pagination helper
            401: {"description": "Not authenticated"},
            403: {"description": "Not authorized"},
        },
    )
    @jwt_required()
    def get(self):
        """Get list of organizations user belongs to"""
        current_user_id = int(get_jwt_identity())

        query = Organization.query.join(
            Organization.organization_users
        ).filter_by(user_id=current_user_id)

        return paginate(
            query,
            OrganizationSchema(many=True),
            collection_name="organizations",
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
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)

        org = Organization(**org_data)
        db.session.add(org)
        db.session.flush()

        org.add_user(current_user, OrganizationUserRole.OWNER)
        db.session.commit()

        return org, 201
