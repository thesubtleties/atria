from api.extensions import ma
from marshmallow import validates_schema, ValidationError, validate
from api.models.enums import (
    EmailVisibility,
    ConnectionRequestPermission,
    SocialLinksVisibility
)


class PrivacySettingsSchema(ma.Schema):
    """Schema for user privacy settings"""
    
    class Meta:
        name = "PrivacySettings"
    
    email_visibility = ma.Enum(
        EmailVisibility, 
        by_value=True,
        load_default=EmailVisibility.CONNECTIONS_ORGANIZERS
    )
    show_public_email = ma.Boolean(
        load_default=False
    )
    public_email = ma.Email(
        allow_none=True,
        load_default=None
    )
    allow_connection_requests = ma.Enum(
        ConnectionRequestPermission,
        by_value=True,
        load_default=ConnectionRequestPermission.EVERYONE
    )
    show_social_links = ma.Enum(
        SocialLinksVisibility,
        by_value=True,
        load_default=SocialLinksVisibility.EVERYONE
    )
    show_company = ma.Boolean(
        load_default=True
    )
    show_bio = ma.Boolean(
        load_default=True
    )
    
    @validates_schema
    def validate_public_email(self, data, **kwargs):
        """Validate public email is provided if show_public_email is True"""
        if data.get('show_public_email') and not data.get('public_email'):
            raise ValidationError(
                "Public email is required when show_public_email is enabled",
                field_name='public_email'
            )


class PrivacySettingsUpdateSchema(PrivacySettingsSchema):
    """Schema for updating privacy settings - all fields optional"""
    
    class Meta:
        name = "PrivacySettingsUpdate"
    
    # Override fields to make them truly optional (no missing defaults)
    email_visibility = ma.Enum(
        EmailVisibility,
        by_value=True,
        allow_none=True
    )
    show_public_email = ma.Boolean(
        allow_none=True
    )
    public_email = ma.String(
        allow_none=True,
        validate=lambda x: x is None or x == '' or ('@' in x and '.' in x.split('@')[1] if '@' in x else False)
    )
    allow_connection_requests = ma.Enum(
        ConnectionRequestPermission,
        by_value=True,
        allow_none=True
    )
    show_social_links = ma.Enum(
        SocialLinksVisibility,
        by_value=True,
        allow_none=True
    )
    show_company = ma.Boolean(
        allow_none=True
    )
    show_bio = ma.Boolean(
        allow_none=True
    )


class EventPrivacyOverrideSchema(PrivacySettingsSchema):
    """Schema for event-specific privacy overrides"""
    
    class Meta:
        name = "EventPrivacyOverride"
    
    event_id = ma.Integer(required=True)


class UserPrivacyResponseSchema(ma.Schema):
    """Response schema for user privacy settings"""
    
    class Meta:
        name = "UserPrivacyResponse"
    
    privacy_settings = ma.Dict()  # Return as plain dict, not nested schema
    event_overrides = ma.List(
        ma.Dict(),  # Also return as plain dicts
        dump_only=True
    )


class ModerationStatusSchema(ma.Schema):
    """Schema for event user moderation status"""
    
    class Meta:
        name = "ModerationStatus"
    
    is_banned = ma.Boolean(dump_only=True)
    banned_at = ma.DateTime(dump_only=True, allow_none=True)
    banned_by = ma.Integer(dump_only=True, allow_none=True)
    ban_reason = ma.String(dump_only=True, allow_none=True)
    is_chat_banned = ma.Boolean(dump_only=True)
    chat_ban_until = ma.DateTime(dump_only=True, allow_none=True)
    chat_ban_reason = ma.String(dump_only=True, allow_none=True)
    can_use_chat = ma.Method("get_can_use_chat", dump_only=True)
    
    def get_can_use_chat(self, obj):
        """Check if user can currently use chat"""
        if hasattr(obj, 'can_use_chat'):
            return obj.can_use_chat()
        return not obj.is_banned and not obj.is_chat_banned


class BanUserSchema(ma.Schema):
    """Schema for banning a user from an event"""
    
    class Meta:
        name = "BanUser"
    
    reason = ma.String(
        required=True,
        validate=validate.Length(min=1, max=500)
    )
    moderation_notes = ma.String(
        allow_none=True,
        validate=validate.Length(max=1000)
    )


class ChatBanUserSchema(ma.Schema):
    """Schema for chat-banning a user"""
    
    class Meta:
        name = "ChatBanUser"
    
    reason = ma.String(
        required=True,
        validate=validate.Length(min=1, max=500)
    )
    duration_hours = ma.Integer(
        allow_none=True,
        validate=validate.Range(min=1, max=720)  # Max 30 days
    )
    moderation_notes = ma.String(
        allow_none=True,
        validate=validate.Length(max=1000)
    )