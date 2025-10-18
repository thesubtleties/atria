from api.extensions import ma, db
from api.models import OrganizationInvitation
from api.models.enums import OrganizationUserRole
from marshmallow import validates, ValidationError, validate
import re


class OrganizationInvitationSchema(ma.SQLAlchemyAutoSchema):
    """Base OrganizationInvitation Schema"""

    class Meta:
        model = OrganizationInvitation
        sqla_session = db.session
        include_fk = True
        name = "OrganizationInvitationBase"
        exclude = ["token"]  # Never expose the token in lists

    # Computed Properties
    is_expired = ma.Boolean(dump_only=True)
    is_pending = ma.Boolean(dump_only=True)


class OrganizationInvitationDetailSchema(OrganizationInvitationSchema):
    """Detailed OrganizationInvitation Schema with relationships"""

    class Meta(OrganizationInvitationSchema.Meta):
        name = "OrganizationInvitationDetail"

    organization = ma.Nested("OrganizationSchema", only=("id", "name"), dump_only=True)
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


class OrganizationInvitationCreateSchema(ma.Schema):
    """Schema for creating organization invitations"""

    class Meta:
        name = "OrganizationInvitationCreate"

    email = ma.String(required=True)
    role = ma.Enum(OrganizationUserRole, required=True)
    message = ma.String(allow_none=True, validate=validate.Length(max=500))

    @validates("email")
    def validate_email(self, value, **kwargs):
        """Validate email format"""
        email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_regex, value):
            raise ValidationError("Invalid email format")


class BulkOrganizationInvitationCreateSchema(ma.Schema):
    """Schema for bulk creating organization invitations"""

    class Meta:
        name = "BulkOrganizationInvitationCreate"

    invitations = ma.List(
        ma.Nested(OrganizationInvitationCreateSchema),
        required=True,
        validate=validate.Length(min=1, max=100)
    )


class OrganizationInvitationAcceptSchema(ma.Schema):
    """Schema for accepting an invitation"""

    class Meta:
        name = "OrganizationInvitationAccept"

    # No fields needed - token is in URL, user from JWT