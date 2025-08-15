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
]


def register_blueprints(api):
    print("\n\nRegistering blueprints\n\n")
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
