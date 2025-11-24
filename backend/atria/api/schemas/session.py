from api.extensions import ma, db
from api.models import Session
from api.models.enums import SessionType, SessionStatus, SessionSpeakerRole, SessionChatMode, StreamingPlatform
from api.commons.streaming import (
    extract_vimeo_id,
    extract_mux_playback_id,
    normalize_zoom_url,
    normalize_jitsi_room_name,
    validate_other_stream_url
)
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
    stream_url = ma.String(allow_none=True)
    day_number = ma.Integer(required=True)
    chat_mode = ma.Enum(SessionChatMode, load_default=SessionChatMode.ENABLED)

    # Streaming platform fields (multi-platform support: Vimeo/Mux/Zoom/Jitsi/Other)
    streaming_platform = ma.Enum(StreamingPlatform, allow_none=True)
    zoom_meeting_id = ma.String(allow_none=True)
    zoom_passcode = ma.String(allow_none=True)
    mux_playback_policy = ma.String(allow_none=True)  # 'PUBLIC' or 'SIGNED'
    jitsi_room_name = ma.String(allow_none=True)  # JaaS room identifier
    other_stream_url = ma.String(allow_none=True)  # External streaming URL for OTHER platform

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

    @validates_schema
    def validate_streaming_config(self, data, **kwargs):
        """Validate streaming configuration and normalize URLs to IDs"""
        platform = data.get('streaming_platform')

        if not platform:
            # No platform selected - that's fine, streaming is optional
            return

        if platform == StreamingPlatform.VIMEO:
            raw_value = data.get('stream_url')
            if not raw_value:
                raise ValidationError(
                    {"stream_url": "Vimeo URL or video ID required when platform is VIMEO"}
                )

            # Extract and normalize to video ID only
            video_id = extract_vimeo_id(raw_value)
            if not video_id:
                raise ValidationError(
                    {"stream_url": "Invalid Vimeo input. Provide URL (https://vimeo.com/123456789) or video ID"}
                )

            # Normalize: Store ID only in database
            data['stream_url'] = video_id

        elif platform == StreamingPlatform.MUX:
            raw_value = data.get('stream_url')
            if not raw_value:
                raise ValidationError(
                    {"stream_url": "Mux Playback ID or URL required when platform is MUX"}
                )

            # Extract and normalize to Playback ID only
            playback_id = extract_mux_playback_id(raw_value)
            if not playback_id:
                raise ValidationError(
                    {"stream_url": "Invalid Mux input. Provide Playback ID or stream URL"}
                )

            # Normalize: Store Playback ID only in database
            data['stream_url'] = playback_id

            # Validate mux_playback_policy if provided
            policy = data.get('mux_playback_policy')
            if policy and policy not in ['PUBLIC', 'SIGNED']:
                raise ValidationError(
                    {"mux_playback_policy": "Invalid Mux playback policy. Must be 'PUBLIC' or 'SIGNED'"}
                )

        elif platform == StreamingPlatform.ZOOM:
            raw_value = data.get('zoom_meeting_id')
            if not raw_value:
                raise ValidationError(
                    {"zoom_meeting_id": "Zoom meeting URL or ID required when platform is ZOOM"}
                )

            # Normalize to full join URL
            normalized_url = normalize_zoom_url(raw_value)
            if not normalized_url:
                raise ValidationError(
                    {"zoom_meeting_id": "Invalid Zoom input. Provide meeting URL or ID (9-11 digits)"}
                )

            # Normalize: Store full join URL in database
            data['zoom_meeting_id'] = normalized_url

        elif platform == StreamingPlatform.JITSI:
            raw_value = data.get('jitsi_room_name')
            if not raw_value:
                raise ValidationError(
                    {"jitsi_room_name": "Jitsi room name or URL required when platform is JITSI"}
                )

            # Normalize to URL-safe room name
            normalized_room = normalize_jitsi_room_name(raw_value)
            if not normalized_room:
                raise ValidationError(
                    {"jitsi_room_name": "Invalid Jitsi room name. Use 3-200 characters (letters, numbers, dashes)"}
                )

            # Normalize: Store normalized room name in database
            data['jitsi_room_name'] = normalized_room

        elif platform == StreamingPlatform.OTHER:
            raw_value = data.get('other_stream_url')
            if not raw_value:
                raise ValidationError(
                    {"other_stream_url": "Stream URL required when platform is OTHER"}
                )

            # Validate URL format (must be HTTPS)
            validated_url = validate_other_stream_url(raw_value)
            if not validated_url:
                raise ValidationError(
                    {"other_stream_url": "Invalid URL. Must be a valid HTTPS URL"}
                )

            # Store validated URL in database
            data['other_stream_url'] = validated_url


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
    stream_url = ma.String(allow_none=True)
    day_number = ma.Integer()
    chat_mode = ma.Enum(SessionChatMode)

    # Streaming platform fields (multi-platform support: Vimeo/Mux/Zoom/Jitsi/Other)
    streaming_platform = ma.Enum(StreamingPlatform, allow_none=True)
    zoom_meeting_id = ma.String(allow_none=True)
    zoom_passcode = ma.String(allow_none=True)
    mux_playback_policy = ma.String(allow_none=True)  # 'PUBLIC' or 'SIGNED'
    jitsi_room_name = ma.String(allow_none=True)  # JaaS room identifier
    other_stream_url = ma.String(allow_none=True)  # External streaming URL for OTHER platform

    @validates_schema
    def validate_streaming_config(self, data, **kwargs):
        """Validate streaming configuration and normalize URLs to IDs"""
        platform = data.get('streaming_platform')

        if not platform:
            # No platform in update - that's fine
            return

        if platform == StreamingPlatform.VIMEO:
            raw_value = data.get('stream_url')
            if not raw_value:
                raise ValidationError(
                    {"stream_url": "Vimeo URL or video ID required when platform is VIMEO"}
                )

            # Extract and normalize to video ID only
            video_id = extract_vimeo_id(raw_value)
            if not video_id:
                raise ValidationError(
                    {"stream_url": "Invalid Vimeo input. Provide URL (https://vimeo.com/123456789) or video ID"}
                )

            # Normalize: Store ID only in database
            data['stream_url'] = video_id

        elif platform == StreamingPlatform.MUX:
            raw_value = data.get('stream_url')
            if not raw_value:
                raise ValidationError(
                    {"stream_url": "Mux Playback ID or URL required when platform is MUX"}
                )

            # Extract and normalize to Playback ID only
            playback_id = extract_mux_playback_id(raw_value)
            if not playback_id:
                raise ValidationError(
                    {"stream_url": "Invalid Mux input. Provide Playback ID or stream URL"}
                )

            # Normalize: Store Playback ID only in database
            data['stream_url'] = playback_id

            # Validate mux_playback_policy if provided
            policy = data.get('mux_playback_policy')
            if policy and policy not in ['PUBLIC', 'SIGNED']:
                raise ValidationError(
                    {"mux_playback_policy": "Invalid Mux playback policy. Must be 'PUBLIC' or 'SIGNED'"}
                )

        elif platform == StreamingPlatform.ZOOM:
            raw_value = data.get('zoom_meeting_id')
            if not raw_value:
                raise ValidationError(
                    {"zoom_meeting_id": "Zoom meeting URL or ID required when platform is ZOOM"}
                )

            # Normalize to full join URL
            normalized_url = normalize_zoom_url(raw_value)
            if not normalized_url:
                raise ValidationError(
                    {"zoom_meeting_id": "Invalid Zoom input. Provide meeting URL or ID (9-11 digits)"}
                )

            # Normalize: Store full join URL in database
            data['zoom_meeting_id'] = normalized_url

        elif platform == StreamingPlatform.JITSI:
            raw_value = data.get('jitsi_room_name')
            if not raw_value:
                raise ValidationError(
                    {"jitsi_room_name": "Jitsi room name or URL required when platform is JITSI"}
                )

            # Normalize to URL-safe room name
            normalized_room = normalize_jitsi_room_name(raw_value)
            if not normalized_room:
                raise ValidationError(
                    {"jitsi_room_name": "Invalid Jitsi room name. Use 3-200 characters (letters, numbers, dashes)"}
                )

            # Normalize: Store normalized room name in database
            data['jitsi_room_name'] = normalized_room

        elif platform == StreamingPlatform.OTHER:
            raw_value = data.get('other_stream_url')
            if not raw_value:
                raise ValidationError(
                    {"other_stream_url": "Stream URL required when platform is OTHER"}
                )

            # Validate URL format (must be HTTPS)
            validated_url = validate_other_stream_url(raw_value)
            if not validated_url:
                raise ValidationError(
                    {"other_stream_url": "Invalid URL. Must be a valid HTTPS URL"}
                )

            # Store validated URL in database
            data['other_stream_url'] = validated_url


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

    # Jitsi (JaaS)-specific
    app_id = ma.String(dump_only=True, allow_none=True)  # JaaS App ID
    room_name = ma.String(dump_only=True, allow_none=True)  # Jitsi room name
    token = ma.String(dump_only=True, allow_none=True)  # JWT token for JaaS authentication
    expires_at = ma.String(dump_only=True, allow_none=True)  # Token expiration timestamp
