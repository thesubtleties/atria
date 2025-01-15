from api.api.resources.auth import (
    AuthSignupResource,
    AuthLoginResource,
    AuthRefreshResource,
    AuthLogoutResource,
)
from api.api.resources.user import (
    UserResource,
    UserEventsResource,
    UserSessionsResource,
)
from api.api.resources.organization import (
    OrganizationResource,
    OrganizationList,
)
from api.api.resources.organization_user import (
    OrganizationUserList,
    OrganizationUserDetail,
)
from api.api.resources.event import (
    EventResource,
    EventList,
    EventBrandingResource,
)
from api.api.resources.event_user import (
    EventUserList,
    EventUserDetail,
    EventSpeakerInfo,
)
from api.api.resources.session import (
    SessionList,
    SessionResource,
    SessionStatusResource,
    SessionTimesResource,
)
from api.api.resources.session_speaker import (
    SessionSpeakerList,
    SessionSpeakerDetail,
    SessionSpeakerReorder,
)

__all__ = [
    # Auth
    "AuthSignupResource",
    "AuthLoginResource",
    "AuthRefreshResource",
    "AuthLogoutResource",
    # User
    "UserResource",
    "UserEventsResource",
    "UserSessionsResource",
    # Organization
    "OrganizationResource",
    "OrganizationList",
    "OrganizationUserList",
    "OrganizationUserDetail",
    # Event
    "EventResource",
    "EventList",
    "EventBrandingResource",
    "EventUserList",
    "EventUserDetail",
    "EventSpeakerInfo",
    # Session
    "SessionList",
    "SessionResource",
    "SessionStatusResource",
    "SessionTimesResource",
    "SessionSpeakerList",
    "SessionSpeakerDetail",
    "SessionSpeakerReorder",
]
