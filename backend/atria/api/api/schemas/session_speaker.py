from api.extensions import ma, db
from api.models import SessionSpeaker
from api.models.enums import SessionSpeakerRole
from marshmallow import validates, ValidationError


class SessionSpeakerSchema(ma.SQLAlchemyAutoSchema):
    """Base SessionSpeaker Schema"""

    class Meta:
        model = SessionSpeaker
        sqla_session = db.session
        include_fk = True

    # Computed Property
    speaker_name = ma.String(dump_only=True)

    # From User Model
    image_url = ma.String(attribute="user.image_url")
    title = ma.String(attribute="user.title")
    company_name = ma.String(attribute="user.company_name")
    social_links = ma.Dict(attribute="user.social_links")


class SessionSpeakerDetailSchema(SessionSpeakerSchema):
    """Detailed SessionSpeaker Schema with relationships"""

    session = ma.Nested(
        "SessionSchema",
        only=(
            "id",
            "title",
            "start_time",
            "end_time",
            "day_number",
        ),
        dump_only=True,
    )
    user = ma.Nested(
        "UserSchema",
        only=("bio",),
        dump_only=True,
    )


class SessionSpeakerCreateSchema(ma.Schema):
    """Schema for adding speakers to sessions"""

    user_id = ma.Integer(required=True)
    role = ma.Enum(SessionSpeakerRole, required=True)
    order = ma.Integer()  # Optional, will be auto-set if not provided


class SessionSpeakerUpdateSchema(ma.Schema):
    """Schema for updating session speaker details"""

    role = ma.Enum(SessionSpeakerRole)
    order = ma.Integer()


class SpeakerReorderSchema(ma.Schema):
    """Schema for reordering speaker"""

    order = ma.Integer(required=True)

    @validates("order")
    def validate_order(self, value):
        if value < 1:
            raise ValidationError("Order must be positive")
