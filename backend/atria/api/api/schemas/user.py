# api/api/schemas/user.py
from api.extensions import ma, db
from api.models import User
from marshmallow import validates, ValidationError


class UserSchema(ma.SQLAlchemyAutoSchema):
    """Base User Schema"""

    class Meta:
        model = User
        load_instance = True
        sqla_session = db.session
        exclude = ("_password",)  # Don't expose password hash
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
    events = ma.Nested(
        "EventSchema",
        many=True,
        only=(
            "id",
            "title",
            "start_date",
        ),
    )
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
    def validate_password(self, value):
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
