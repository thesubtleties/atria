from api.schemas.user import (
    UserSchema,
    UserDetailSchema,
    UserCreateSchema,
    UserUpdateSchema,
    # UserNestedSchema,  # TODO: Remove - confirmed unused, commented out in user.py
    UserCheckResponseSchema,
    UserBasicSchema,  # Actually used in UserCheckResponseSchema
)
from api.schemas.event import (
    EventSchema,
    EventDetailSchema,
    EventCreateSchema,
    EventUpdateSchema,
    EventBrandingSchema,
    EventNestedSchema,
    AddUserToEventSchema,
)
from api.schemas.session import (
    SessionSchema,
    SessionDetailSchema,
    SessionAdminListSchema,
    SessionCreateSchema,
    SessionUpdateSchema,
    SessionTimesUpdateSchema,
    SessionStatusUpdateSchema,
    SessionPlaybackDataSchema,
)
from api.schemas.organization import (
    OrganizationSchema,
    OrganizationDetailSchema,
    OrganizationCreateSchema,
    OrganizationUpdateSchema,
    OrganizationMuxCredentialsSetSchema,
)
from api.schemas.event_user import (
    EventUserSchema,
    EventUserDetailSchema,
    EventUserCreateSchema,
    EventUserUpdateSchema,
    EventSpeakerInfoUpdateSchema,
    EventUserAdminSchema,
    EventUserNetworkingSchema,
)
from api.schemas.event_invitation import (
    EventInvitationSchema,
    EventInvitationDetailSchema,
    EventInvitationCreateSchema,
    BulkEventInvitationCreateSchema,
    EventInvitationAcceptSchema,
)
from api.schemas.organization_invitation import (
    OrganizationInvitationSchema,
    OrganizationInvitationDetailSchema,
    OrganizationInvitationCreateSchema,
    BulkOrganizationInvitationCreateSchema,
    OrganizationInvitationAcceptSchema,
)
from api.schemas.organization_user import (
    OrganizationUserSchema,
    OrganizationUserDetailSchema,
    OrganizationUserCreateSchema,
    OrganizationUserUpdateSchema,
    OrganizationUserNestedSchema,
    AddUserToOrgSchema,
)
from api.schemas.session_speaker import (
    SessionSpeakerSchema,
    SessionSpeakerDetailSchema,
    SessionSpeakerCreateSchema,
    SessionSpeakerUpdateSchema,
    SpeakerReorderSchema,
)

from api.schemas.auth import (
    LoginSchema,
    SignupSchema,
    SignupResponseSchema,
    EmailVerificationResponseSchema,
    ResendVerificationSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    ValidateResetTokenResponseSchema,
    VerifyPasswordSchema,
    ChangePasswordSchema,
)

from api.schemas.chat import (
    ChatRoomSchema,
    ChatRoomDetailSchema,
    ChatRoomCreateSchema,
    ChatRoomUpdateSchema,
    ChatRoomAdminSchema,
    ChatMessageSchema,
    ChatMessageCreateSchema,
    SessionChatRoomSchema,
)
from api.schemas.connection import (
    ConnectionSchema,
    ConnectionCreateSchema,
    ConnectionUpdateSchema,
)
from api.schemas.direct_message import (
    DirectMessageThreadSchema,
    DirectMessageSchema,
    DirectMessageCreateSchema,
    DirectMessageThreadCreateSchema,
    DirectMessagesWithContextSchema,
    MarkMessagesReadResponseSchema,
)
from api.schemas.sponsor import (
    SponsorSchema,
    SponsorDetailSchema,
    SponsorCreateSchema,
    SponsorUpdateSchema,
    SponsorListSchema,
    SponsorTierSchema,
)
from api.schemas.upload import (
    ImageUploadSchema,
    ImageUploadResponseSchema,
    PresignedUrlResponseSchema,
)
from api.schemas.invitation import (
    InvitationDetailsResponseSchema,
    RegisterAndAcceptInvitationsSchema,
    RegisterAndAcceptResponseSchema,
)
from api.schemas.moderation import (
    ModerationStatusSchema,
    BanUserSchema,
    UnbanUserSchema,
    ChatBanUserSchema,
    ChatUnbanUserSchema,
    ModerationActionResponseSchema,
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
    "SessionAdminListSchema",
    "SessionCreateSchema",
    "SessionUpdateSchema",
    "SessionTimesUpdateSchema",
    "SessionStatusUpdateSchema",
    "SessionPlaybackDataSchema",
    # Organization schemas
    "OrganizationSchema",
    "OrganizationDetailSchema",
    "OrganizationCreateSchema",
    "OrganizationUpdateSchema",
    "OrganizationMuxCredentialsSetSchema",
    # Junction table schemas
    "EventUserSchema",
    "EventUserDetailSchema",
    "EventUserCreateSchema",
    "EventUserUpdateSchema",
    "EventSpeakerInfoUpdateSchema",
    "EventUserAdminSchema",
    "EventUserNetworkingSchema",
    "EventInvitationSchema",
    "EventInvitationDetailSchema",
    "EventInvitationCreateSchema",
    "BulkEventInvitationCreateSchema",
    "EventInvitationAcceptSchema",
    "OrganizationInvitationSchema",
    "OrganizationInvitationDetailSchema",
    "OrganizationInvitationCreateSchema",
    "BulkOrganizationInvitationCreateSchema",
    "OrganizationInvitationAcceptSchema",
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
    "SignupResponseSchema",
    "EmailVerificationResponseSchema",
    "ResendVerificationSchema",
    "ForgotPasswordSchema",
    "ResetPasswordSchema",
    "ValidateResetTokenResponseSchema",
    "VerifyPasswordSchema",
    "ChangePasswordSchema",
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
    "DirectMessageThreadCreateSchema",
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
    # Invitation schemas
    "InvitationDetailsResponseSchema",
    "RegisterAndAcceptInvitationsSchema",
    "RegisterAndAcceptResponseSchema",
    # Moderation schemas
    "ModerationStatusSchema",
    "BanUserSchema",
    "UnbanUserSchema",
    "ChatBanUserSchema",
    "ChatUnbanUserSchema",
    "ModerationActionResponseSchema",
]
