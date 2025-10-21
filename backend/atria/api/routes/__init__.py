from flask_smorest import Blueprint

from .users import blp as users_blp
from .events import blp as events_blp
from .event_users import blp as event_users_blp
from .event_invitations import blp as event_invitations_blp
from .organizations import blp as organizations_blp
from .organization_users import blp as organization_users_blp
from .organization_invitations import blp as organization_invitations_blp
from .sessions import blp as sessions_blp
from .session_speakers import blp as session_speakers_blp
from .auth import blp as auth_blp
from .connections import blp as connections_blp
from .chat_rooms import blp as chat_rooms_blp
from .direct_messages import blp as direct_messages_blp
from .sponsors import blp as sponsors_blp
from .uploads import blp as uploads_blp
from .invitations import blp as invitations_blp
from .moderation import blp as moderation_blp
from .health import blp as health_blp
from .analytics import blp as analytics_blp

__all__ = [
    # User blueprints
    "users_blp",
    # Event blueprints
    "events_blp",
    "event_users_blp",
    "event_invitations_blp",
    # Organization blueprints
    "organizations_blp",
    "organization_users_blp",
    "organization_invitations_blp",
    # Session blueprints
    "sessions_blp",
    "session_speakers_blp",
    # Auth blueprints
    "auth_blp",
    # Connection blueprints
    "connections_blp",
    # Chat blueprints
    "chat_rooms_blp",
    "direct_messages_blp",
    # Sponsors blueprint
    "sponsors_blp",
    # Uploads blueprint
    "uploads_blp",
    # Public invitations blueprint
    "invitations_blp",
    # Moderation blueprint
    "moderation_blp",
    # Health check blueprint
    "health_blp",
    # Analytics blueprint
    "analytics_blp",
]


def register_pagination_schemas(api):
    """
    Manually register pagination wrapper schemas with Flask-SMOREST.

    This ensures all PaginatedXYZ schemas are available in the OpenAPI spec
    without Flask-SMOREST trying to use them for serialization (which would
    cause errors since paginate() returns already-serialized dicts).
    """
    from api.commons.pagination import create_pagination_schema
    from api.schemas import (
        EventSchema,
        OrganizationSchema,
        OrganizationUserSchema,
        DirectMessageThreadSchema,
        EventInvitationDetailSchema,
        OrganizationInvitationDetailSchema,
        EventUserSchema,
        EventUserAdminSchema,
        ConnectionSchema,
        UserSchema,
        SessionDetailSchema,
        SessionSpeakerSchema,
        ChatRoomSchema,
        ChatMessageSchema,
    )

    # List of (schema_class, collection_name) tuples for all paginated endpoints
    pagination_schemas = [
        # Events
        (EventSchema, "events"),
        # Organizations
        (OrganizationSchema, "organizations"),
        # Organization Users
        (OrganizationUserSchema, "organization_users"),
        # Direct Messages
        (DirectMessageThreadSchema, "threads"),
        # Invitations
        (EventInvitationDetailSchema, "invitations"),
        (OrganizationInvitationDetailSchema, "invitations"),
        # Event Users
        (EventUserSchema, "event_users"),
        (EventUserAdminSchema, "event_users"),
        # Connections
        (ConnectionSchema, "connections"),
        (UserSchema, "users"),
        # Sessions
        (SessionDetailSchema, "sessions"),
        (SessionSpeakerSchema, "session_speakers"),
        # Chat
        (ChatRoomSchema, "chat_rooms"),
        (ChatMessageSchema, "messages"),
    ]

    print("\n🔧 Registering pagination schemas...")
    for schema_class, collection_name in pagination_schemas:
        paginated_schema = create_pagination_schema(schema_class, collection_name)
        schema_name = paginated_schema.Meta.name
        api.spec.components.schema(schema_name, schema=paginated_schema)
        print(f"  ✅ Registered: {schema_name}")
    print(f"✅ Registered {len(pagination_schemas)} pagination schemas\n")


def register_blueprints(api):
    # Register pagination schemas BEFORE blueprints
    # This ensures all PaginatedXYZ schemas are available in OpenAPI
    register_pagination_schemas(api)

    print("\n\nRegistering blueprints\n\n")
    # Health (register first for monitoring)
    api.register_blueprint(health_blp)

    # Auth
    api.register_blueprint(auth_blp)

    # Users
    api.register_blueprint(users_blp)

    # Organizations
    api.register_blueprint(organizations_blp)
    api.register_blueprint(organization_users_blp)
    api.register_blueprint(organization_invitations_blp)

    # Events
    api.register_blueprint(events_blp)
    api.register_blueprint(event_users_blp)
    api.register_blueprint(event_invitations_blp)

    # Sessions
    api.register_blueprint(sessions_blp)
    api.register_blueprint(session_speakers_blp)

    # Connections
    api.register_blueprint(connections_blp)
    # Chat
    api.register_blueprint(chat_rooms_blp)
    api.register_blueprint(direct_messages_blp)
    # Sponsors
    api.register_blueprint(sponsors_blp)
    # Uploads
    api.register_blueprint(uploads_blp)
    # Public invitations
    api.register_blueprint(invitations_blp)
    # Moderation
    api.register_blueprint(moderation_blp)
    # Analytics (register last - no auth required, public endpoint)
    api.register_blueprint(analytics_blp)
