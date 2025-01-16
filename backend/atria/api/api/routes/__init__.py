from flask_smorest import Blueprint

from .users import blp as users_blp
from .events import blp as events_blp
from .event_users import blp as event_users_blp
from .organizations import blp as organizations_blp
from .organization_users import blp as organization_users_blp
from .sessions import blp as sessions_blp
from .session_speakers import blp as session_speakers_blp
from .auth import blp as auth_blp

__all__ = [
    # User blueprints
    "users_blp",
    # Event blueprints
    "events_blp",
    "event_users_blp",
    # Organization blueprints
    "organizations_blp",
    "organization_users_blp",
    # Session blueprints
    "sessions_blp",
    "session_speakers_blp",
    # Auth blueprints
    "auth_blp",
]


def register_blueprints(api):
    # Auth
    api.register_blueprint(auth_blp)

    # Users
    api.register_blueprint(users_blp)

    # Organizations
    api.register_blueprint(organizations_blp)
    api.register_blueprint(organization_users_blp)

    # Events
    api.register_blueprint(events_blp)
    api.register_blueprint(event_users_blp)

    # Sessions
    api.register_blueprint(sessions_blp)
    api.register_blueprint(session_speakers_blp)
