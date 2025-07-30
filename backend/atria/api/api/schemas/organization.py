from api.extensions import ma, db
from api.models import Organization, User
from api.models.enums import OrganizationUserRole
from marshmallow import validates, ValidationError, post_dump


class OrganizationUserNestedSchema(ma.SQLAlchemyAutoSchema):
    """Schema for users when nested in organization"""

    class Meta:
        model = User
        fields = ("id", "full_name", "email")

    role = ma.Function(
        lambda obj, parent: next(
            (
                ou.role.value
                for ou in parent.organization_users
                if ou.user_id == obj.id
            ),
            None,
        )
    )


class OrganizationSchema(ma.SQLAlchemyAutoSchema):
    """Base Organization Schema"""

    class Meta:
        model = Organization
        sqla_session = db.session
        include_fk = True
        name = "OrganizationBase"

    users = ma.Nested(
        "api.api.schemas.organization_user.OrganizationUserNestedSchema",  # Full path
        many=True,
        attribute="organization_users",
        dump_only=True,
    )


class OrganizationDetailSchema(OrganizationSchema):
    """Detailed Organization Schema with relationships"""

    class Meta(OrganizationSchema.Meta):
        name = "OrganizationDetail"

    member_count = ma.Integer(dump_only=True)
    owner_count = ma.Integer(dump_only=True)
    user_is_admin_or_owner = ma.Boolean(dump_only=True)
    current_user_role = ma.Method("get_current_user_role", dump_only=True)

    users = ma.Nested(
        "api.api.schemas.organization_user.OrganizationUserNestedSchema",
        many=True,
        attribute="organization_users",
        dump_only=True,
    )

    upcoming_events = ma.Nested(
        "api.api.schemas.event.EventNestedSchema",  # Use full path like we did with users
        many=True,
        dump_only=True,
    )

    def get_current_user_role(self, obj):
        """Get the current user's role in the organization"""
        from flask_jwt_extended import get_jwt_identity
        
        try:
            current_user_id = int(get_jwt_identity())
            user = User.query.get(current_user_id)
            if user and obj.has_user(user):
                return obj.get_user_role(user).value
        except Exception:
            pass
        return None


# Creation Schema - Used for POST /organizations
class OrganizationCreateSchema(ma.Schema):
    """Schema for creating new organizations"""

    class Meta:
        name = "OrganizationCreate"

    name = ma.String(required=True)

    @validates("name")
    def validate_name(self, value, **kwargs):
        if len(value.strip()) < 2:
            raise ValidationError("Name must be at least 2 characters")


# Update Schema - Used for PUT /organizations/<id>
class OrganizationUpdateSchema(ma.Schema):
    """Schema for updating organizations"""

    class Meta:
        name = "OrganizationUpdate"

    name = ma.String()

    @validates("name")
    def validate_name(self, value, **kwargs):
        if len(value.strip()) < 2:
            raise ValidationError("Name must be at least 2 characters")


# User Role Update Schema - Used for PUT /organizations/<id>/users/<id>
class OrganizationUserRoleUpdateSchema(ma.Schema):
    """Schema for updating user roles in organization"""

    class Meta:
        name = "OrganizationUserRoleUpdate"

    role = ma.Enum(OrganizationUserRole, required=True)


# User Add Schema - Used for POST /organizations/<id>/users
class OrganizationAddUserSchema(ma.Schema):
    """Schema for adding users to organization"""

    class Meta:
        name = "OrganizationAddUser"

    user_id = ma.Integer(required=True)
    role = ma.Enum(OrganizationUserRole, required=True)
