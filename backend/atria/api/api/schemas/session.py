from api.extensions import ma, db
from api.models import Session
from api.models.enums import SessionType, SessionStatus, SessionSpeakerRole
from marshmallow import validates, ValidationError
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

    # Add speakers here instead
    speakers = ma.Nested(
        "UserSchema",
        many=True,
        only=(
            "id",
            "full_name",
            "title",
            "company_name",
            "image_url",
            "session_speakers.role",
        ),
        dump_only=True,
    )


class SessionCreateSchema(ma.Schema):
    """Schema for creating sessions"""

    class Meta:
        name = "SessionCreate"

    title = ma.String(required=True)
    session_type = ma.Enum(SessionType, required=True)
    status = ma.Enum(SessionStatus, load_default=SessionStatus.SCHEDULED)
    description = ma.String()
    start_time = ma.Time(required=True)
    end_time = ma.Time(required=True)
    stream_url = ma.String()
    day_number = ma.Integer(required=True)

    @validates("title")
    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise ValidationError("Title must be at least 3 characters")

    @validates("day_number")
    def validate_day_number(self, value):
        if value < 1:
            raise ValidationError("Day number must be positive")

    @validates("end_time")
    def validate_times(self, end_time, **kwargs):
        start_time = kwargs["data"].get("start_time")
        if start_time and end_time <= start_time:
            raise ValidationError("End time must be after start time")


class SessionUpdateSchema(ma.Schema):
    """Schema for updating sessions"""

    class Meta:
        name = "SessionUpdate"

    title = ma.String()
    session_type = ma.Enum(SessionType)
    status = ma.Enum(SessionStatus)
    description = ma.String()
    start_time = ma.Time()
    end_time = ma.Time()
    stream_url = ma.String()
    day_number = ma.Integer()


class SessionTimesUpdateSchema(ma.Schema):
    """Schema specifically for updating session times"""

    class Meta:
        name = "SessionTimesUpdate"

    start_time = ma.Time(required=True)
    end_time = ma.Time(required=True)

    @validates("end_time")
    def validate_times(self, end_time, **kwargs):
        start_time = kwargs["data"].get("start_time")
        if start_time and end_time <= start_time:
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
