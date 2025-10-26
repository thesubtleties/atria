from api.extensions import ma, db
from api.models import EventUser
from api.models.enums import EventUserRole
from marshmallow import validates_schema, ValidationError


class EventUserSchema(ma.SQLAlchemyAutoSchema):
    """Base EventUser Schema"""

    class Meta:
        model = EventUser
        sqla_session = db.session
        include_fk = True
        name = "EventUserBase"

    # Computed Properties
    user_name = ma.String(dump_only=True)
    is_speaker = ma.Boolean(dump_only=True)
    is_organizer = ma.Boolean(dump_only=True)
    first_name = ma.String(dump_only=True)
    last_name = ma.String(dump_only=True)
    sort_name = ma.String(dump_only=True)
    image_url = ma.String(dump_only=True)
    social_links = ma.Dict(dump_only=True)
    company_name = ma.String(dump_only=True)
    title = ma.String(dump_only=True)
    
    # Connection status fields (added dynamically by service)
    connection_status = ma.String(dump_only=True, allow_none=True)
    connection_id = ma.Integer(dump_only=True, allow_none=True)
    connection_direction = ma.String(dump_only=True, allow_none=True)


class EventUserDetailSchema(EventUserSchema):
    """Detailed EventUser Schema with relationships"""

    class Meta(EventUserSchema.Meta):
        name = "EventUserDetail"

    event = ma.Nested("EventSchema", only=("id", "title"), dump_only=True)
    user = ma.Nested(
        "UserSchema",
        only=("id", "full_name", "email", "image_url"),
        dump_only=True,
    )


class EventUserCreateSchema(ma.Schema):
    """Schema for adding users to events"""

    class Meta:
        name = "EventUserCreate"

    user_id = ma.Integer(required=True)
    role = ma.Enum(EventUserRole, required=True)
    speaker_bio = ma.String()  # Optional
    speaker_title = ma.String()  # Optional


class EventUserUpdateSchema(ma.Schema):
    """Schema for updating event user roles"""

    class Meta:
        name = "EventUserUpdate"

    role = ma.Enum(EventUserRole)
    speaker_bio = ma.String()
    speaker_title = ma.String()


class EventSpeakerInfoUpdateSchema(ma.Schema):
    """Schema specifically for updating speaker info"""

    class Meta:
        name = "EventSpeakerInfoUpdate"

    speaker_bio = ma.String()
    speaker_title = ma.String()

    @validates_schema
    def validate_has_fields(self, data, **kwargs):
        if not data.get("speaker_bio") and not data.get("speaker_title"):
            raise ValidationError("Must provide either bio or title to update")


class EventUserAdminSchema(EventUserSchema):
    """Admin view of EventUser with sensitive information"""

    class Meta(EventUserSchema.Meta):
        name = "EventUserAdmin"

    # Include sensitive fields only for admins/organizers
    email = ma.String(dump_only=True)
    full_name = ma.String(dump_only=True)
    session_count = ma.Integer(dump_only=True)
    sessions = ma.List(ma.Dict(), dump_only=True)
    
    # Moderation status fields
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


class EventUserNetworkingSchema(EventUserSchema):
    """Schema for viewing event attendees in networking area - respects privacy settings"""
    
    class Meta(EventUserSchema.Meta):
        name = "EventUserNetworking"
        # Exclude admin/moderation fields from networking view
        exclude = (
            "ban_reason", "banned_at", "banned_by",
            "chat_ban_reason", "chat_ban_until", 
            "is_banned", "is_chat_banned",
            "moderation_notes", "created_at",
            "privacy_overrides"  # Internal field, not for public
        )
    
    # User data fields with privacy filtering
    # Note: email may be None based on privacy settings
    # Even admins see privacy-filtered data here to understand what's public
    email = ma.Method("get_filtered_email", dump_only=True, allow_none=True)
    can_send_connection_request = ma.Method("get_can_send_connection_request", dump_only=True, allow_none=True)
    full_name = ma.String(dump_only=True)
    bio = ma.String(dump_only=True, allow_none=True)

    def get_filtered_email(self, obj):
        """Get the privacy-filtered email from the custom attribute"""
        return getattr(obj, '_filtered_email', None)

    def get_can_send_connection_request(self, obj):
        """Get whether viewer can send connection request based on privacy settings"""
        return getattr(obj, '_can_send_connection_request', None)

    # These fields already come from base EventUserSchema:
    # first_name, last_name, image_url, social_links, company_name, title
    # connection_status, connection_id, connection_direction
    
    # Session info for speakers
    session_count = ma.Integer(dump_only=True, allow_none=True)
    sessions = ma.List(ma.Dict(), dump_only=True, allow_none=True)
    
    # Speaker-specific fields (from base schema, shown when role is SPEAKER)
    speaker_bio = ma.String(dump_only=True, allow_none=True)
    speaker_title = ma.String(dump_only=True, allow_none=True)
