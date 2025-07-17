from api.api.schemas.user import (
    UserSchema,
    UserDetailSchema,
    UserCreateSchema,
    UserUpdateSchema,
    # UserNestedSchema,  # TODO: Remove - confirmed unused, commented out in user.py
    UserCheckResponseSchema,
    UserBasicSchema,  # Actually used in UserCheckResponseSchema
)
from api.api.schemas.event import (
    EventSchema,
    EventDetailSchema,
    EventCreateSchema,
    EventUpdateSchema,
    EventBrandingSchema,
    EventNestedSchema,
    AddUserToEventSchema,
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
    OrganizationUserNestedSchema,
    AddUserToOrgSchema,
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

from api.api.schemas.chat import (
    ChatRoomSchema,
    ChatRoomDetailSchema,
    ChatRoomCreateSchema,
    ChatRoomUpdateSchema,
    ChatRoomAdminSchema,
    ChatMessageSchema,
    ChatMessageCreateSchema,
    SessionChatRoomSchema,
)
from api.api.schemas.connection import (
    ConnectionSchema,
    ConnectionCreateSchema,
    ConnectionUpdateSchema,
)
from api.api.schemas.direct_message import (
    DirectMessageThreadSchema,
    DirectMessageSchema,
    DirectMessageCreateSchema,
)
from api.api.schemas.sponsor import (
    SponsorSchema,
    SponsorDetailSchema,
    SponsorCreateSchema,
    SponsorUpdateSchema,
    SponsorListSchema,
    SponsorTierSchema,
)
from api.api.schemas.upload import (
    ImageUploadSchema,
    ImageUploadResponseSchema,
    PresignedUrlResponseSchema,
)

__all__ = [
    # User schemas
    "UserSchema",
    "UserDetailSchema",
    "UserCreateSchema",
    "UserUpdateSchema",
    "UserNestedSchema",
    "UserCheckResponseSchema",
    "BasicUserSchema",
    # Event schemas
    "EventSchema",
    "EventDetailSchema",
    "EventCreateSchema",
    "EventUpdateSchema",
    "EventBrandingSchema",
    "EventNestedSchema",
    "AddUserToEventSchema",
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
    "OrganizationUserNestedSchema",
    "AddUserToOrgSchema",
    "SessionSpeakerSchema",
    "SessionSpeakerDetailSchema",
    "SessionSpeakerCreateSchema",
    "SessionSpeakerUpdateSchema",
    "SpeakerReorderSchema",
    # Auth schemas
    "LoginSchema",
    "SignupSchema",
    # Networking schemas
    "ChatRoomSchema",
    "ChatRoomDetailSchema",
    "ChatRoomCreateSchema",
    "ChatRoomUpdateSchema",
    "ChatRoomAdminSchema",
    "ChatMessageSchema",
    "ChatMessageCreateSchema",
    "SessionChatRoomSchema",
    "ConnectionSchema",
    "ConnectionCreateSchema",
    "ConnectionUpdateSchema",
    "DirectMessageThreadSchema",
    "DirectMessageSchema",
    "DirectMessageCreateSchema",
    # Sponsor schemas
    "SponsorSchema",
    "SponsorDetailSchema",
    "SponsorCreateSchema",
    "SponsorUpdateSchema",
    "SponsorListSchema",
    "SponsorTierSchema",
    # Upload schemas
    "ImageUploadSchema",
    "ImageUploadResponseSchema",
    "PresignedUrlResponseSchema",
]
