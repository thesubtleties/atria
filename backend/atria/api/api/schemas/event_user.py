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
