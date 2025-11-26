# api/api/routes/organizations.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.schemas import (
    OrganizationSchema,
    OrganizationDetailSchema,
    OrganizationCreateSchema,
    OrganizationUpdateSchema,
    OrganizationMuxCredentialsSetSchema,
    OrganizationJaasCredentialsSetSchema,
)
from api.commons.decorators import org_admin_required, org_member_required
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_doc_reference,
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
            200: get_pagination_doc_reference("OrganizationBase"),
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


@blp.route("/organizations/<int:org_id>/mux-credentials")
class OrganizationMuxCredentials(MethodView):
    @blp.arguments(OrganizationMuxCredentialsSetSchema)
    @blp.response(200, OrganizationDetailSchema)
    @blp.doc(
        summary="Set/update Mux credentials",
        description="Set or update organization's Mux BYOA credentials (owner/admin only). All fields optional.",
        responses={
            403: {"description": "Must be owner or admin"},
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_admin_required()
    def put(self, credentials_data, org_id):
        """Set/update Mux credentials (owner/admin only)

        All credential fields are optional:
        - mux_token_id, mux_token_secret: API credentials (future analytics)
        - mux_signing_key_id, mux_signing_private_key: Signing credentials (SIGNED playback)

        Secrets are automatically encrypted before storage.
        Response includes credential status (boolean flags), never actual secrets.
        """
        from api.models import Organization
        from api.extensions import db

        org = Organization.query.get_or_404(org_id)

        # Set Mux credentials (automatically encrypts secrets)
        org.set_mux_credentials(
            token_id=credentials_data.get('mux_token_id'),
            token_secret=credentials_data.get('mux_token_secret'),
            signing_key_id=credentials_data.get('mux_signing_key_id'),
            signing_private_key=credentials_data.get('mux_signing_private_key')
        )
        db.session.commit()

        # Return full org detail (includes credential status)
        return org

    @blp.response(204)
    @blp.doc(
        summary="Delete Mux credentials",
        description="Remove all Mux credentials from organization (owner/admin only)",
        responses={
            403: {"description": "Must be owner or admin"},
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_admin_required()
    def delete(self, org_id):
        """Delete all Mux credentials (owner/admin only)"""
        from api.models import Organization
        from api.extensions import db

        org = Organization.query.get_or_404(org_id)
        org.clear_mux_credentials()
        db.session.commit()

        return "", 204


@blp.route("/organizations/<int:org_id>/jaas-credentials")
class OrganizationJaasCredentials(MethodView):
    @blp.arguments(OrganizationJaasCredentialsSetSchema)
    @blp.response(200, OrganizationDetailSchema)
    @blp.doc(
        summary="Set/update JaaS credentials",
        description="Set or update organization's JaaS (Jitsi as a Service) credentials (owner/admin only). All fields required.",
        responses={
            403: {"description": "Must be owner or admin"},
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_admin_required()
    def put(self, credentials_data, org_id):
        """Set/update JaaS credentials (owner/admin only)

        All credential fields are required:
        - jaas_app_id: JaaS App ID (vpaas-magic-cookie-xxx)
        - jaas_api_key: API Key ID for JWT header
        - jaas_private_key: RSA Private Key in PEM format

        Secrets (api_key and private_key) are automatically encrypted before storage.
        Response includes credential status (boolean flag), never actual secrets.
        """
        from api.models import Organization
        from api.extensions import db

        org = Organization.query.get_or_404(org_id)

        # Set JaaS credentials (automatically encrypts secrets)
        org.set_jaas_credentials(
            app_id=credentials_data.get('jaas_app_id'),
            api_key=credentials_data.get('jaas_api_key'),
            private_key=credentials_data.get('jaas_private_key')
        )
        db.session.commit()

        # Return full org detail (includes credential status)
        return org

    @blp.response(204)
    @blp.doc(
        summary="Delete JaaS credentials",
        description="Remove all JaaS credentials from organization (owner/admin only)",
        responses={
            403: {"description": "Must be owner or admin"},
            404: {"description": "Organization not found"},
        },
    )
    @jwt_required()
    @org_admin_required()
    def delete(self, org_id):
        """Delete all JaaS credentials (owner/admin only)"""
        from api.models import Organization
        from api.extensions import db

        org = Organization.query.get_or_404(org_id)
        org.clear_jaas_credentials()
        db.session.commit()

        return "", 204
