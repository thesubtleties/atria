from api.extensions import ma, db
from api.models import OrganizationUser
from api.models.enums import OrganizationUserRole
from marshmallow import validates, ValidationError


class OrganizationUserSchema(ma.SQLAlchemyAutoSchema):
    """Base OrganizationUser Schema"""

    class Meta:
        model = OrganizationUser
        sqla_session = db.session
        include_fk = True
        name = "OrganizationUser"

    # Computed Properties
    user_name = ma.String(dump_only=True)
    is_owner = ma.Boolean(dump_only=True)
    is_admin = ma.Boolean(dump_only=True)

    # User field
    image_url = ma.String(attribute="user.image_url")


class OrganizationUserDetailSchema(OrganizationUserSchema):
    """Detailed OrganizationUser Schema with relationships"""

    class Meta(OrganizationUserSchema.Meta):
        name = "OrganizationUserDetail"

    organization = ma.Nested(
        "OrganizationSchema", only=("id", "name"), dump_only=True
    )
    user = ma.Nested(
        "UserSchema",
        only=("id", "full_name", "email"),
        dump_only=True,
    )


class OrganizationUserCreateSchema(ma.Schema):
    """Schema for adding users to organizations"""

    class Meta:
        name = "OrganizationUserCreate"

    user_id = ma.Integer(required=True)
    role = ma.Enum(OrganizationUserRole, required=True)


class OrganizationUserUpdateSchema(ma.Schema):
    """Schema for updating organization user roles"""

    class Meta:
        name = "OrganizationUserUpdate"

    role = ma.Enum(OrganizationUserRole, required=True)
