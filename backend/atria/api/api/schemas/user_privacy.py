# api/api/schemas/user_privacy.py
from api.extensions import ma


class PrivacyAwareUserSchema(ma.Schema):
    """
    User schema that applies privacy filtering based on viewer context.
    This schema should be used for all public-facing user endpoints.
    """
    
    class Meta:
        name = "PrivacyAwareUser"
    
    # Always visible fields
    id = ma.Integer(dump_only=True)
    first_name = ma.String(dump_only=True)
    last_name = ma.String(dump_only=True)
    full_name = ma.String(dump_only=True)
    image_url = ma.String(dump_only=True)
    
    # Conditionally visible fields (may be None based on privacy)
    email = ma.String(dump_only=True, allow_none=True)
    company_name = ma.String(dump_only=True, allow_none=True)
    title = ma.String(dump_only=True, allow_none=True)
    bio = ma.String(dump_only=True, allow_none=True)
    social_links = ma.Dict(dump_only=True)
    
    # Privacy control fields
    allow_connection_requests = ma.String(dump_only=True)
    can_send_connection_request = ma.Boolean(dump_only=True)
    is_connected = ma.Boolean(dump_only=True)
    
    # Event-specific fields (only included when event context present)
    event_role = ma.String(dump_only=True, allow_none=True)
    speaker_bio = ma.String(dump_only=True, allow_none=True)
    speaker_title = ma.String(dump_only=True, allow_none=True)
    
    # Privacy settings (only for self)
    privacy_settings = ma.Dict(dump_only=True, allow_none=True)
    
    # Account info (only for self)
    created_at = ma.DateTime(dump_only=True, allow_none=True)
    is_active = ma.Boolean(dump_only=True, allow_none=True)
    email_verified = ma.Boolean(dump_only=True, allow_none=True)
    
    # No @pre_dump needed - service layer handles filtering


class PrivacyAwareUserListSchema(ma.Schema):
    """
    Minimal user schema for list views with privacy filtering.
    """
    
    class Meta:
        name = "PrivacyAwareUserList"
    
    # Always visible fields
    id = ma.Integer(dump_only=True)
    first_name = ma.String(dump_only=True)
    last_name = ma.String(dump_only=True)
    full_name = ma.String(dump_only=True)
    image_url = ma.String(dump_only=True)
    
    # Conditionally visible fields
    email = ma.String(dump_only=True, allow_none=True)
    company_name = ma.String(dump_only=True, allow_none=True)
    title = ma.String(dump_only=True, allow_none=True)
    
    # Connection status
    is_connected = ma.Boolean(dump_only=True)
    can_send_connection_request = ma.Boolean(dump_only=True)
    
    # Event role if in event context
    event_role = ma.String(dump_only=True, allow_none=True)
    
    # No @pre_dump needed - service layer handles filtering


class EventUserWithPrivacySchema(ma.Schema):
    """
    Event user schema that includes both event-specific data and privacy-filtered user data.
    """
    
    class Meta:
        name = "EventUserWithPrivacy"
    
    # Event-specific fields
    event_id = ma.Integer(dump_only=True)
    user_id = ma.Integer(dump_only=True)
    role = ma.String(dump_only=True)
    created_at = ma.DateTime(dump_only=True)
    
    # Moderation status (only visible to organizers)
    is_banned = ma.Boolean(dump_only=True, allow_none=True)
    is_chat_banned = ma.Boolean(dump_only=True, allow_none=True)
    can_use_chat = ma.Boolean(dump_only=True, allow_none=True)
    
    # User data (privacy filtered)
    user = ma.Nested(PrivacyAwareUserSchema, dump_only=True)
    
    # No @pre_dump needed - service layer should handle permission checks for moderation fields