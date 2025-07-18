from api.extensions import ma, db
from api.models import EventInvitation
from api.models.enums import EventUserRole
from marshmallow import validates, ValidationError, validate
import re


class EventInvitationSchema(ma.SQLAlchemyAutoSchema):
    """Base EventInvitation Schema"""

    class Meta:
        model = EventInvitation
        sqla_session = db.session
        include_fk = True
        name = "EventInvitationBase"
        exclude = ["token"]  # Never expose the token in lists

    # Computed Properties
    is_expired = ma.Boolean(dump_only=True)
    is_pending = ma.Boolean(dump_only=True)


class EventInvitationDetailSchema(EventInvitationSchema):
    """Detailed EventInvitation Schema with relationships"""

    class Meta(EventInvitationSchema.Meta):
        name = "EventInvitationDetail"

    event = ma.Nested("EventSchema", only=("id", "title"), dump_only=True)
    invited_by = ma.Nested(
        "UserSchema",
        only=("id", "full_name", "email"),
        dump_only=True,
    )
    user = ma.Nested(
        "UserSchema",
        only=("id", "full_name", "email"),
        dump_only=True,
    )


class EventInvitationCreateSchema(ma.Schema):
    """Schema for creating event invitations"""

    class Meta:
        name = "EventInvitationCreate"

    email = ma.String(required=True)
    role = ma.Enum(EventUserRole, required=True)
    message = ma.String(allow_none=True, validate=validate.Length(max=500))

    @validates("email")
    def validate_email(self, value, **kwargs):
        """Validate email format"""
        email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_regex, value):
            raise ValidationError("Invalid email format")


class BulkEventInvitationCreateSchema(ma.Schema):
    """Schema for bulk creating event invitations"""

    class Meta:
        name = "BulkEventInvitationCreate"

    invitations = ma.List(
        ma.Nested(EventInvitationCreateSchema),
        required=True,
        validate=validate.Length(min=1, max=100)
    )


class EventInvitationAcceptSchema(ma.Schema):
    """Schema for accepting an invitation"""

    class Meta:
        name = "EventInvitationAccept"

    # No fields needed - token is in URL, user from JWT


class AddUserToEventSchema(ma.Schema):
    """Schema for directly adding a user without invitation"""

    class Meta:
        name = "AddUserToEvent"

    email = ma.String(required=True)
    first_name = ma.String(required=True)
    last_name = ma.String(required=True)
    role = ma.Enum(EventUserRole, required=True)
    password = ma.String(allow_none=True)  # Optional
