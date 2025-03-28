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

    first_name = ma.String(dump_only=True)
    last_name = ma.String(dump_only=True)
    sort_name = ma.String(dump_only=True)
    image_url = ma.String(dump_only=True)
    social_links = ma.Dict(dump_only=True)

    # # User field
    # image_url = ma.String(attribute="user.image_url") # attribute is used to access nested fields - in case we have circular imports


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


class OrganizationUserNestedSchema(ma.SQLAlchemyAutoSchema):
    """Schema for organization users when nested"""

    class Meta:
        model = OrganizationUser
        include_fk = True
        exclude = (
            "organization",
            "organization_id",
            "created_at",
            "user_id",
        )  # Add user_id to exclude

    # Flatten user data
    id = ma.Integer(attribute="user.id")
    full_name = ma.String(attribute="user.full_name")
    email = ma.String(attribute="user.email")
    role = ma.Enum(OrganizationUserRole)  # Include role directly


class AddUserToOrgSchema(ma.Schema):
    """Schema for adding/creating users in organization"""

    class Meta:
        name = "AddUserToOrg"

    email = ma.Email(required=True)
    password = ma.String(load_only=True)
    first_name = ma.String(required=True)
    last_name = ma.String(required=True)
    role = ma.Enum(OrganizationUserRole, required=True)
