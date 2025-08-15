# api/api/schemas/user.py
from api.extensions import ma, db
from api.models import User
from api.models.enums import EventUserRole
from marshmallow import validates, ValidationError


class UserSchema(ma.SQLAlchemyAutoSchema):
    """Base User Schema"""

    class Meta:
        model = User
        load_instance = True
        sqla_session = db.session
        exclude = ("_password", "organizations")  # Don't expose password hash
        name = "UserBase"

    # Computed Properties
    full_name = ma.String(dump_only=True)


class UserDetailSchema(UserSchema):
    """Detailed User Schema with relationships"""

    class Meta(UserSchema.Meta):
        name = "UserDetail"

    organizations = ma.Nested(
        "OrganizationSchema",
        many=True,
        only=(
            "id",
            "name",
        ),
    )
    events = ma.Method("get_active_events", dump_only=True)
    
    def get_active_events(self, obj):
        """Get user's active events (excluding banned) with same format as nested events"""
        # Use the existing event_users relationship to avoid N+1 queries
        # Filter out banned events from the already loaded relationship
        active_events = []
        for event_user in obj.event_users:
            if not event_user.is_banned:
                event = event_user.event
                active_events.append({
                    "id": event.id,
                    "title": event.title,
                    "start_date": event.start_date.isoformat() if event.start_date else None
                })
        return active_events
    speaking_sessions = ma.Nested(
        "SessionSchema",
        many=True,
        only=(
            "id",
            "title",
        ),
    )


class UserCreateSchema(ma.Schema):
    """Schema for user creation"""

    class Meta:
        name = "UserCreate"

    email = ma.Email(required=True)
    password = ma.String(required=True, load_only=True)
    first_name = ma.String(required=True)
    last_name = ma.String(required=True)
    company_name = ma.String()
    title = ma.String()
    bio = ma.String()

    @validates("password")
    def validate_password(self, value, **kwargs):
        if len(value) < 8:
            raise ValidationError("Password must be at least 8 characters")


class UserUpdateSchema(ma.Schema):
    """Schema for admin creating user accounts"""

    class Meta:
        name = "UserUpdate"

    first_name = ma.String()
    last_name = ma.String()
    company_name = ma.String()
    title = ma.String()
    bio = ma.String()
    image_url = ma.URL()
    social_links = ma.Dict()


class UserWithRoleSchema(ma.Schema):
    """Schema for user data including their event role"""

    class Meta:
        name = "UserWithRole"

    id = ma.Integer(dump_only=True)
    full_name = ma.String(dump_only=True)
    email = ma.String(dump_only=True)
    role = ma.Enum(EventUserRole, dump_only=True)


# TODO: Remove UserNestedSchema - confirmed unused during codebase analysis
# This schema is not imported or used anywhere in routes, services, or other schemas.
# It was likely leftover from the resources_OLD → routes/schemas/services refactor.
# Keeping commented out temporarily in case there are hidden dependencies.
# Safe to delete after thorough testing of user-related functionality.

# class UserNestedSchema(ma.SQLAlchemyAutoSchema):
#     """Schema for users when nested in other schemas"""
#
#     class Meta:
#         model = User
#         fields = (
#             "id",
#             "full_name",
#             "email",
#             "role",
#         )  # Only the fields we need
#
#     role = ma.Method("get_role")
#
#     def get_role(self, obj):
#         organization = obj.organizations[0] if obj.organizations else None
#         if organization:
#             role = organization.get_user_role(obj)
#             print(f"Role found: {role}")  # Debug print
#             return role.value if role else None
#         return None


class UserBasicSchema(ma.SQLAlchemyAutoSchema):
    """Basic user information schema"""

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name")
        name = "UserBasic"


class UserCheckResponseSchema(ma.Schema):
    """Schema for user check response"""

    class Meta:
        name = "UserCheckResponse"

    user = ma.Nested(UserBasicSchema, allow_none=True)
