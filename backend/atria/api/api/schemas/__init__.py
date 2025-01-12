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
)
from api.api.schemas.session import (
    SessionSchema,
    SessionDetailSchema,
    SessionCreateSchema,
    SessionUpdateSchema,
)
from api.api.schemas.organization import (
    OrganizationSchema,
    OrganizationDetailSchema,
)
from api.api.schemas.event_user import EventUserSchema, EventUserDetailSchema
from api.api.schemas.organization_user import (
    OrganizationUserSchema,
    OrganizationUserDetailSchema,
)
from api.api.schemas.session_speaker import (
    SessionSpeakerSchema,
    SessionSpeakerDetailSchema,
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
    # Session schemas
    "SessionSchema",
    "SessionDetailSchema",
    "SessionCreateSchema",
    "SessionUpdateSchema",
    # Organization schemas
    "OrganizationSchema",
    "OrganizationDetailSchema",
    # Junction table schemas
    "EventUserSchema",
    "EventUserDetailSchema",
    "OrganizationUserSchema",
    "OrganizationUserDetailSchema",
    "SessionSpeakerSchema",
    "SessionSpeakerDetailSchema",
]
