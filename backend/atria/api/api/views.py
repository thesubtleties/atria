from flask import Blueprint, current_app, jsonify
from flask_restful import Api
from marshmallow import ValidationError
from api.extensions import apispec

# Import ALL resources
from api.api.resources import (
    # Auth
    AuthSignupResource,
    AuthLoginResource,
    AuthRefreshResource,
    AuthLogoutResource,
    # User
    UserResource,
    UserEventsResource,
    UserSessionsResource,
    # Organization
    OrganizationResource,
    OrganizationList,
    OrganizationUserList,
    OrganizationUserDetail,
    # Event
    EventResource,
    EventList,
    EventBrandingResource,
    EventUserList,
    EventUserDetail,
    EventSpeakerInfo,
    # Session
    SessionList,
    SessionResource,
    SessionStatusResource,
    SessionTimesResource,
    SessionSpeakerList,
    SessionSpeakerDetail,
    SessionSpeakerReorder,
)

# Import ALL schemas
from api.api.schemas import (
    UserSchema,
    UserDetailSchema,
    UserCreateSchema,
    UserUpdateSchema,
    EventSchema,
    EventDetailSchema,
    EventCreateSchema,
    EventUpdateSchema,
    EventBrandingSchema,
    SessionSchema,
    SessionDetailSchema,
    SessionCreateSchema,
    SessionUpdateSchema,
    SessionTimesUpdateSchema,
    SessionStatusUpdateSchema,
    OrganizationSchema,
    OrganizationDetailSchema,
    OrganizationCreateSchema,
    OrganizationUpdateSchema,
    EventUserSchema,
    EventUserDetailSchema,
    EventUserCreateSchema,
    EventUserUpdateSchema,
    OrganizationUserSchema,
    OrganizationUserDetailSchema,
    OrganizationUserCreateSchema,
    OrganizationUserUpdateSchema,
    SessionSpeakerSchema,
    SessionSpeakerDetailSchema,
    SessionSpeakerCreateSchema,
    SessionSpeakerUpdateSchema,
    SpeakerReorderSchema,
)

blueprint = Blueprint("api", __name__, url_prefix="/api")
api = Api(blueprint)

# Auth routes
api.add_resource(AuthSignupResource, "/auth/signup")
api.add_resource(AuthLoginResource, "/auth/login")
api.add_resource(AuthRefreshResource, "/auth/refresh")
api.add_resource(AuthLogoutResource, "/auth/logout")

# User routes
api.add_resource(UserResource, "/users/<int:user_id>")
api.add_resource(UserEventsResource, "/users/<int:user_id>/events")
api.add_resource(
    UserSessionsResource, "/users/<int:user_id>/speaking-sessions"
)

# Organization routes
api.add_resource(OrganizationResource, "/organizations/<int:org_id>")
api.add_resource(OrganizationList, "/organizations")
api.add_resource(OrganizationUserList, "/organizations/<int:org_id>/users")
api.add_resource(
    OrganizationUserDetail, "/organizations/<int:org_id>/users/<int:user_id>"
)

# Event routes
api.add_resource(EventList, "/organizations/<int:org_id>/events")
api.add_resource(EventResource, "/events/<int:event_id>")
api.add_resource(EventBrandingResource, "/events/<int:event_id>/branding")
api.add_resource(EventUserList, "/events/<int:event_id>/users")
api.add_resource(EventUserDetail, "/events/<int:event_id>/users/<int:user_id>")
api.add_resource(
    EventSpeakerInfo, "/events/<int:event_id>/users/<int:user_id>/speaker-info"
)

# Session routes
api.add_resource(SessionList, "/events/<int:event_id>/sessions")
api.add_resource(SessionResource, "/sessions/<int:session_id>")
api.add_resource(SessionStatusResource, "/sessions/<int:session_id>/status")
api.add_resource(SessionTimesResource, "/sessions/<int:session_id>/times")
api.add_resource(SessionSpeakerList, "/sessions/<int:session_id>/speakers")
api.add_resource(
    SessionSpeakerDetail, "/sessions/<int:session_id>/speakers/<int:user_id>"
)
api.add_resource(
    SessionSpeakerReorder,
    "/sessions/<int:session_id>/speakers/<int:user_id>/reorder",
)


@blueprint.before_app_request
def register_views():
    """Register schemas and paths for API documentation"""
    # Register ALL schemas
    schemas = {
        # User schemas
        "User_Base": UserSchema,
        "User_Detail": UserDetailSchema,
        "User_Create": UserCreateSchema,
        "User_Update": UserUpdateSchema,
        # Event schemas
        "Event_Base": EventSchema,
        "Event_Detail": EventDetailSchema,
        "Event_Create": EventCreateSchema,
        "Event_Update": EventUpdateSchema,
        "Event_Branding": EventBrandingSchema,
        # Session schemas
        "Session_Base": SessionSchema,
        "Session_Detail": SessionDetailSchema,
        "Session_Create": SessionCreateSchema,
        "Session_Update": SessionUpdateSchema,
        "Session_Times": SessionTimesUpdateSchema,
        "Session_Status": SessionStatusUpdateSchema,
        # Organization schemas
        "Organization_Base": OrganizationSchema,
        "Organization_Detail": OrganizationDetailSchema,
        "Organization_Create": OrganizationCreateSchema,
        "Organization_Update": OrganizationUpdateSchema,
        # Junction table schemas
        "EventUser_Base": EventUserSchema,
        "EventUser_Detail": EventUserDetailSchema,
        "EventUser_Create": EventUserCreateSchema,
        "EventUser_Update": EventUserUpdateSchema,
        "OrgUser_Base": OrganizationUserSchema,
        "OrgUser_Detail": OrganizationUserDetailSchema,
        "OrgUser_Create": OrganizationUserCreateSchema,
        "OrgUser_Update": OrganizationUserUpdateSchema,
        "SessionSpeaker_Base": SessionSpeakerSchema,
        "SessionSpeaker_Detail": SessionSpeakerDetailSchema,
        "SessionSpeaker_Create": SessionSpeakerCreateSchema,
        "SessionSpeaker_Update": SessionSpeakerUpdateSchema,
        "SessionSpeaker_Reorder": SpeakerReorderSchema,
    }

    for name, schema in schemas.items():
        if name not in apispec.spec.components.schemas:
            apispec.spec.components.schema(name, schema=schema)

    # Register ALL resources for Swagger
    resources = [
        # Auth resources
        AuthSignupResource,
        AuthLoginResource,
        AuthRefreshResource,
        AuthLogoutResource,
        # User resources
        UserResource,
        UserEventsResource,
        UserSessionsResource,
        # Organization resources
        OrganizationResource,
        OrganizationList,
        OrganizationUserList,
        OrganizationUserDetail,
        # Event resources
        EventResource,
        EventList,
        EventBrandingResource,
        EventUserList,
        EventUserDetail,
        EventSpeakerInfo,
        # Session resources
        SessionList,
        SessionResource,
        SessionStatusResource,
        SessionTimesResource,
        SessionSpeakerList,
        SessionSpeakerDetail,
        SessionSpeakerReorder,
    ]

    for resource in resources:
        apispec.spec.path(view=resource, app=current_app)


@blueprint.errorhandler(ValidationError)
def handle_marshmallow_error(e):
    """Return json error for marshmallow validation errors."""
    return jsonify(e.messages), 400
