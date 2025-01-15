# Location: api/api/schemas/__init__.py

from api.api.schemas.user import (
    UserSchema,
    UserDetailSchema,
    UserCreateSchema,
    UserUpdateSchema,
)
from api.api.schemas.event import (
    EventSchema,
    EventDetailSchema,
    EventCreateSchema,
    EventUpdateSchema,
    EventBrandingSchema,
)
from api.api.schemas.session import (
    SessionSchema,
    SessionDetailSchema,
    SessionCreateSchema,
    SessionUpdateSchema,
    SessionTimesUpdateSchema,
    SessionStatusUpdateSchema,
)
from api.api.schemas.organization import (
    OrganizationSchema,
    OrganizationDetailSchema,
    OrganizationCreateSchema,
    OrganizationUpdateSchema,
)
from api.api.schemas.event_user import (
    EventUserSchema,
    EventUserDetailSchema,
    EventUserCreateSchema,
    EventUserUpdateSchema,
    EventSpeakerInfoUpdateSchema,
)
from api.api.schemas.organization_user import (
    OrganizationUserSchema,
    OrganizationUserDetailSchema,
    OrganizationUserCreateSchema,
    OrganizationUserUpdateSchema,
)
from api.api.schemas.session_speaker import (
    SessionSpeakerSchema,
    SessionSpeakerDetailSchema,
    SessionSpeakerCreateSchema,
    SessionSpeakerUpdateSchema,
    SpeakerReorderSchema,
)

from api.api.schemas.auth import (
    LoginSchema,
    SignupSchema,
)

__all__ = [
    # User schemas
    "UserSchema",
    "UserDetailSchema",
    "UserCreateSchema",
    "UserUpdateSchema",
    # Event schemas
    "EventSchema",
    "EventDetailSchema",
    "EventCreateSchema",
    "EventUpdateSchema",
    "EventBrandingSchema",
    # Session schemas
    "SessionSchema",
    "SessionDetailSchema",
    "SessionCreateSchema",
    "SessionUpdateSchema",
    "SessionTimesUpdateSchema",
    "SessionStatusUpdateSchema",
    # Organization schemas
    "OrganizationSchema",
    "OrganizationDetailSchema",
    "OrganizationCreateSchema",
    "OrganizationUpdateSchema",
    # Junction table schemas
    "EventUserSchema",
    "EventUserDetailSchema",
    "EventUserCreateSchema",
    "EventUserUpdateSchema",
    "EventSpeakerInfoUpdateSchema",
    "OrganizationUserSchema",
    "OrganizationUserDetailSchema",
    "OrganizationUserCreateSchema",
    "OrganizationUserUpdateSchema",
    "SessionSpeakerSchema",
    "SessionSpeakerDetailSchema",
    "SessionSpeakerCreateSchema",
    "SessionSpeakerUpdateSchema",
    "SpeakerReorderSchema",
    # Auth schemas
    "LoginSchema",
    "SignupSchema",
]
