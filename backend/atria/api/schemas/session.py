from api.extensions import ma, db
from api.models import Session
from api.models.enums import SessionType, SessionStatus, SessionSpeakerRole, SessionChatMode
from marshmallow import validates, validates_schema, ValidationError, validate
from datetime import time


# api/api/schemas/session.py
class SessionSchema(ma.SQLAlchemyAutoSchema):
    """Base Session Schema"""

    class Meta:
        model = Session
        sqla_session = db.session
        include_fk = True
        # Exclude the speakers relationship from base schema
        exclude = ("speakers",)
        name = "SessionBase"

    # Computed Properties
    duration_minutes = ma.Integer(dump_only=True)
    formatted_duration = ma.String(dump_only=True)
    is_live = ma.Boolean(dump_only=True)
    is_completed = ma.Boolean(dump_only=True)
    is_cancelled = ma.Boolean(dump_only=True)
    is_upcoming = ma.Boolean(dump_only=True)
    is_in_progress = ma.Boolean(dump_only=True)
    
    # Chat properties
    chat_mode = ma.Enum(SessionChatMode)
    has_chat_enabled = ma.Boolean(dump_only=True)
    has_public_chat_enabled = ma.Boolean(dump_only=True)
    has_backstage_chat_enabled = ma.Boolean(dump_only=True)


class SessionDetailSchema(SessionSchema):
    """Detailed Session Schema with relationships"""

    class Meta(SessionSchema.Meta):
        name = "SessionDetail"

    # Include event details
    event = ma.Nested(
        "EventSchema",
        only=("id", "title", "start_date", "end_date"),
        dump_only=True,
    )

    # Use the existing SessionSpeakerSchema
    session_speakers = ma.Nested(
        "SessionSpeakerSchema", many=True, dump_only=True
    )


class SessionCreateSchema(ma.Schema):
    """Schema for creating sessions"""

    class Meta:
        name = "SessionCreate"

    title = ma.String(required=True)
    session_type = ma.Enum(SessionType, required=True)
    status = ma.Enum(SessionStatus, load_default=SessionStatus.SCHEDULED)
    short_description = ma.String(validate=validate.Length(max=200))
    description = ma.String()
    start_time = ma.Time(required=True)
    end_time = ma.Time(required=True)
    stream_url = ma.String()
    day_number = ma.Integer(required=True)
    chat_mode = ma.Enum(SessionChatMode, load_default=SessionChatMode.ENABLED)

    @validates("title")
    def validate_title(self, value, **kwargs):
        if len(value.strip()) < 3:
            raise ValidationError("Title must be at least 3 characters")

    @validates("day_number")
    def validate_day_number(self, value, **kwargs):
        if value < 1:
            raise ValidationError("Day number must be positive")

    @validates_schema
    def validate_times(self, data, **kwargs):
        """Validate that end time is after start time"""
        if "start_time" in data and "end_time" in data:
            if data["end_time"] <= data["start_time"]:
                raise ValidationError("End time must be after start time")


class SessionUpdateSchema(ma.Schema):
    """Schema for updating sessions"""

    class Meta:
        name = "SessionUpdate"

    title = ma.String()
    session_type = ma.Enum(SessionType)
    status = ma.Enum(SessionStatus)
    short_description = ma.String(validate=validate.Length(max=200))
    description = ma.String()
    start_time = ma.Time()
    end_time = ma.Time()
    stream_url = ma.String()
    day_number = ma.Integer()
    chat_mode = ma.Enum(SessionChatMode)


class SessionTimesUpdateSchema(ma.Schema):
    """Schema specifically for updating session times"""

    class Meta:
        name = "SessionTimesUpdate"

    start_time = ma.Time(required=True)
    end_time = ma.Time(required=True)

    @validates_schema
    def validate_times(self, data, **kwargs):
        """Validate that end time is after start time"""
        if data["end_time"] <= data["start_time"]:
            raise ValidationError("End time must be after start time")


class SessionStatusUpdateSchema(ma.Schema):
    """Schema for updating session status"""

    class Meta:
        name = "SessionStatusUpdate"

    status = ma.Enum(SessionStatus, required=True)


class SessionSpeakerAddSchema(ma.Schema):
    """Schema for adding speakers to session"""

    class Meta:
        name = "SessionSpeakerAdd"

    user_id = ma.Integer(required=True)
    role = ma.Enum(SessionSpeakerRole, load_default=SessionSpeakerRole.SPEAKER)
    order = ma.Integer(allow_none=True)


class SessionAdminListSchema(SessionSchema):
    """Optimized schema for admin session list - excludes unnecessary relationships"""
    
    class Meta(SessionSchema.Meta):
        name = "SessionAdminList"
    
    # Include only the speaker data we need for the admin view
    session_speakers = ma.Nested(
        "SessionSpeakerSchema", many=True, dump_only=True
    )
    # Explicitly exclude event relationship - not needed in admin list
    # Chat rooms already excluded in base schema


class SessionMinimalSchema(ma.Schema):
    """Minimal session schema for dropdowns and lists"""

    class Meta:
        name = "SessionMinimal"

    id = ma.Integer(dump_only=True)
    title = ma.String(dump_only=True)
    day_number = ma.Integer(dump_only=True)
    start_time = ma.Time(dump_only=True)
    end_time = ma.Time(dump_only=True)


class SessionPlaybackDataSchema(ma.Schema):
    """Schema for platform-agnostic playback data endpoint"""

    class Meta:
        name = "SessionPlaybackData"

    # Common field for all platforms
    platform = ma.String(dump_only=True, required=True)

    # Vimeo/Mux fields (both use HLS/video URLs)
    playback_url = ma.String(dump_only=True, allow_none=True)

    # Mux-specific
    playback_policy = ma.String(dump_only=True, allow_none=True)  # 'PUBLIC' or 'SIGNED'
    tokens = ma.Dict(dump_only=True, allow_none=True)  # JWT tokens for SIGNED playback

    # Zoom-specific
    join_url = ma.String(dump_only=True, allow_none=True)
    passcode = ma.String(dump_only=True, allow_none=True)
