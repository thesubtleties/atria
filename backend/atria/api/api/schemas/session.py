from api.extensions import ma, db
from api.models import Session
from api.models.enums import SessionType, SessionStatus, SessionSpeakerRole
from marshmallow import validates, ValidationError


# api/api/schemas/session.py
class SessionSchema(ma.SQLAlchemyAutoSchema):
    """Base Session Schema"""

    class Meta:
        model = Session
        sqla_session = db.session
        include_fk = True
        # Exclude the speakers relationship from base schema
        exclude = ("speakers",)

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

    title = ma.String(required=True)
    session_type = ma.Enum(SessionType, required=True)
    status = ma.Enum(SessionStatus, load_default=SessionStatus.SCHEDULED)
    description = ma.String()
    start_time = ma.DateTime(required=True)
    end_time = ma.DateTime(required=True)
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


class SessionUpdateSchema(ma.Schema):
    """Schema for updating sessions"""

    title = ma.String()
    session_type = ma.Enum(SessionType)
    status = ma.Enum(SessionStatus)
    description = ma.String()
    start_time = ma.DateTime()
    end_time = ma.DateTime()
    stream_url = ma.String()
    day_number = ma.Integer()


class SessionTimesUpdateSchema(ma.Schema):
    """Schema specifically for updating session times"""

    start_time = ma.DateTime(required=True)
    end_time = ma.DateTime(required=True)


class SessionStatusUpdateSchema(ma.Schema):
    """Schema for updating session status"""

    status = ma.Enum(SessionStatus, required=True)


class SessionSpeakerAddSchema(ma.Schema):
    """Schema for adding speakers to session"""

    user_id = ma.Integer(required=True)
    role = ma.Enum(SessionSpeakerRole, load_default=SessionSpeakerRole.SPEAKER)
