from api.extensions import ma, db
from api.models import Organization
from api.models.enums import OrganizationUserRole
from marshmallow import validates, ValidationError


class OrganizationSchema(ma.SQLAlchemyAutoSchema):
    """Base Organization Schema"""

    class Meta:
        model = Organization
        sqla_session = db.session
        include_fk = True

    owners = ma.Nested(
        "UserSchema",
        many=True,
        only=("id", "full_name", "image_url"),
        attribute="get_users_by_role(OrganizationUserRole.OWNER)",
    )


class OrganizationDetailSchema(OrganizationSchema):
    """Detailed Organization Schema with relationships"""

    # Add computed properties
    member_count = ma.Integer(dump_only=True)
    owner_count = ma.Integer(dump_only=True)

    # Flatter structure for users with roles
    users = ma.Nested(
        "UserSchema",
        many=True,
        only=("id", "full_name", "email", "organization_users.role"),
        dump_only=True,
    )

    # Include upcoming events
    upcoming_events = ma.Nested(
        "EventSchema",
        many=True,
        only=("id", "title", "start_date", "status"),
        dump_only=True,
    )


# Creation Schema - Used for POST /organizations
class OrganizationCreateSchema(ma.Schema):
    """Schema for creating new organizations"""

    name = ma.String(required=True)

    @validates("name")
    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise ValidationError("Name must be at least 2 characters")


# Update Schema - Used for PUT /organizations/<id>
class OrganizationUpdateSchema(ma.Schema):
    """Schema for updating organizations"""

    name = ma.String()

    @validates("name")
    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise ValidationError("Name must be at least 2 characters")


# User Role Update Schema - Used for PUT /organizations/<id>/users/<id>
class OrganizationUserRoleUpdateSchema(ma.Schema):
    """Schema for updating user roles in organization"""

    role = ma.Enum(OrganizationUserRole, required=True)


# User Add Schema - Used for POST /organizations/<id>/users
class OrganizationAddUserSchema(ma.Schema):
    """Schema for adding users to organization"""

    user_id = ma.Integer(required=True)
    role = ma.Enum(OrganizationUserRole, required=True)
