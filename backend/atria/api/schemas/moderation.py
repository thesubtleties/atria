from api.extensions import ma
from marshmallow import validate


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
    moderation_notes = ma.String(dump_only=True, allow_none=True)
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


class UnbanUserSchema(ma.Schema):
    """Schema for unbanning a user from an event"""
    
    class Meta:
        name = "UnbanUser"
    
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


class ChatUnbanUserSchema(ma.Schema):
    """Schema for chat-unbanning a user"""
    
    class Meta:
        name = "ChatUnbanUser"
    
    moderation_notes = ma.String(
        allow_none=True,
        validate=validate.Length(max=1000)
    )


class ModerationActionResponseSchema(ma.Schema):
    """Schema for moderation action responses"""
    
    class Meta:
        name = "ModerationActionResponse"
    
    success = ma.Boolean()
    message = ma.String()
    moderation_status = ma.Nested(ModerationStatusSchema)