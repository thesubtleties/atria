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
    def validate_password(self, value, **kwargs):
        if len(value) < 8:
            raise ValidationError("Password must be at least 8 characters")


class EmailVerificationResponseSchema(ma.Schema):
    """Response schema for email verification"""
    
    class Meta:
        name = "EmailVerificationResponse"
    
    message = ma.String(required=True)
    email = ma.String(required=True)


class ResendVerificationSchema(ma.Schema):
    """Schema for resend verification request"""
    
    class Meta:
        name = "ResendVerification"
    
    email = ma.Email(required=True)


class ForgotPasswordSchema(ma.Schema):
    """Schema for forgot password request"""
    
    class Meta:
        name = "ForgotPassword"
    
    email = ma.Email(required=True)


class ResetPasswordSchema(ma.Schema):
    """Schema for password reset"""
    
    class Meta:
        name = "ResetPassword"
    
    token = ma.String(required=True)
    password = ma.String(required=True, load_only=True)
    
    @validates("password")
    def validate_password(self, value, **kwargs):
        if len(value) < 8:
            raise ValidationError("Password must be at least 8 characters")


class VerifyPasswordSchema(ma.Schema):
    """Schema for password verification"""
    
    class Meta:
        name = "VerifyPassword"
    
    password = ma.String(required=True, load_only=True)


class ValidateResetTokenResponseSchema(ma.Schema):
    """Response schema for reset token validation"""
    
    class Meta:
        name = "ValidateResetTokenResponse"
    
    valid = ma.Boolean(required=True)
    email = ma.String(required=True)


class ChangePasswordSchema(ma.Schema):
    """Schema for changing password"""
    
    class Meta:
        name = "ChangePassword"
    
    current_password = ma.String(required=True, load_only=True)
    new_password = ma.String(required=True, load_only=True)
    
    @validates("new_password")
    def validate_new_password(self, value, **kwargs):
        if len(value) < 8:
            raise ValidationError("Password must be at least 8 characters")


class SignupResponseSchema(ma.Schema):
    """Response schema for signup"""
    
    class Meta:
        name = "SignupResponse"
    
    message = ma.String(required=True)
    email = ma.String(required=True)
    requires_verification = ma.Boolean(required=True)
