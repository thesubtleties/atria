from api.extensions import ma
from marshmallow import validates, ValidationError


class LoginSchema(ma.Schema):
    """Schema for user login"""

    class Meta:
        name = "Login"

    email = ma.Email(
        required=True,
        metadata={"example": "demouser@demo.com", "description": "User email"},
    )
    password = ma.String(
        required=True,
        load_only=True,
        metadata={"example": "changeme", "description": "User password"},
    )


class SignupSchema(ma.Schema):
    """Schema for user signup"""

    class Meta:
        name = "Signup"

    email = ma.Email(required=True)
    password = ma.String(required=True, load_only=True)
    first_name = ma.String(required=True)
    last_name = ma.String(required=True)
    company_name = ma.String()  # Optional
    title = ma.String()  # Optional

    @validates("password")
    def validate_password(self, value):
        if len(value) < 8:
            raise ValidationError("Password must be at least 8 characters")
