from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required

from api.api.schemas import (
    LoginSchema, 
    SignupSchema,
    SignupResponseSchema,
    UserDetailSchema,
    EmailVerificationResponseSchema,
    ResendVerificationSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    ValidateResetTokenResponseSchema,
)
from api.services.auth import AuthService

blp = Blueprint(
    "auth",
    "auth",
    url_prefix="/api/auth",
    description="Authentication operations",
)


@blp.route("/login")
class AuthLoginResource(MethodView):
    @blp.arguments(LoginSchema)
    @blp.response(200)
    @blp.doc(
        summary="Authenticate user",
        description="Authenticates user credentials and returns tokens",
        responses={
            200: {
                "description": "Login successful",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "access_token": {"type": "string"},
                                "refresh_token": {"type": "string"},
                            },
                        }
                    }
                },
            },
            401: {"description": "Invalid credentials"},
        },
    )
    def post(self, login_data):
        """Authenticate user"""
        try:
            return AuthService.login(login_data)
        except ValueError:
            return {"message": "Invalid credentials"}, 401


@blp.route("/me")
class AuthMeResource(MethodView):
    @blp.response(200, UserDetailSchema)
    @blp.doc(
        summary="Get current user",
        description="Get detailed information about the currently authenticated user",
        responses={
            200: {
                "description": "Current user details retrieved successfully",
                "content": {"application/json": {"schema": UserDetailSchema}},
            },
            401: {"description": "Not authenticated"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self):
        """Get current authenticated user"""
        return AuthService.get_current_user()


@blp.route("/refresh")
class AuthRefreshResource(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Refresh access token",
        description="Get new access token using refresh token",
        responses={
            200: {
                "description": "Token refreshed successfully",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {"access_token": {"type": "string"}},
                        }
                    }
                },
            },
            401: {"description": "Invalid or expired refresh token"},
        },
    )
    @jwt_required(refresh=True)
    def post(self):
        """Refresh access token"""
        return AuthService.refresh_token()


@blp.route("/socket-token")
class AuthSocketTokenResource(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Get token for WebSocket connection",
        description="Returns the current JWT token for WebSocket authentication",
        responses={
            200: {
                "description": "Token retrieved successfully",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {"token": {"type": "string"}},
                        }
                    }
                },
            },
            401: {"description": "Not authenticated"},
        },
    )
    @jwt_required()
    def get(self):
        """Get current JWT token for WebSocket"""
        from flask_jwt_extended import get_jwt
        # Return the current token from the request
        # In a production app, you might want to create a short-lived token specifically for WebSocket
        return AuthService.get_socket_token()


@blp.route("/logout")
class AuthLogoutResource(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Logout user",
        description="Revoke current access token",
        responses={
            200: {
                "description": "Successfully logged out",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {"message": {"type": "string"}},
                        },
                        "example": {"message": "Successfully logged out"},
                    }
                },
            },
            401: {"description": "Invalid token"},
            400: {
                "description": "Token revocation failed",
                "content": {
                    "application/json": {
                        "example": {"message": "Token revocation failed"}
                    }
                },
            },
        },
    )
    @jwt_required()
    def post(self):
        """Logout user"""
        try:
            return AuthService.logout()
        except Exception as e:
            abort(400, message=str(e))


@blp.route("/signup")
class AuthSignupResource(MethodView):
    @blp.arguments(SignupSchema)
    @blp.response(201, SignupResponseSchema)
    @blp.doc(
        summary="Register new user",
        description="Create new user account (requires email verification)",
        responses={
            201: {"description": "User created successfully, verification email sent"},
            400: {"description": "Email already registered or invalid input"},
        },
    )
    def post(self, signup_data):
        """Register new user"""
        try:
            result = AuthService.signup(signup_data)
            return result, 201
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/verify-email/<token>")
class EmailVerificationResource(MethodView):
    @blp.response(200, EmailVerificationResponseSchema)
    @blp.doc(
        summary="Verify email address",
        description="Verify user email using verification token",
        responses={
            200: {"description": "Email verified successfully"},
            400: {"description": "Invalid or expired token"},
        },
    )
    def get(self, token):
        """Verify email with token"""
        try:
            from api.services.email_verification import EmailVerificationService
            user = EmailVerificationService.verify_email(token)
            return {"message": "Email verified successfully", "email": user.email}
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/resend-verification")
class ResendVerificationResource(MethodView):
    @blp.arguments(ResendVerificationSchema)
    @blp.response(200)
    @blp.doc(
        summary="Resend verification email",
        description="Resend email verification link",
        responses={
            200: {"description": "Verification email sent"},
            400: {"description": "Email already verified or rate limit exceeded"},
        },
    )
    def post(self, args):
        """Resend verification email"""
        try:
            from api.services.email_verification import EmailVerificationService
            EmailVerificationService.resend_verification(args["email"])
            return {"message": "Verification email sent"}
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/forgot-password")
class ForgotPasswordResource(MethodView):
    @blp.arguments(ForgotPasswordSchema)
    @blp.response(200)
    @blp.doc(
        summary="Request password reset",
        description="Send password reset email",
        responses={
            200: {"description": "Reset email sent if account exists"},
        },
    )
    def post(self, args):
        """Request password reset"""
        from api.services.password_reset import PasswordResetService
        # Always return success to prevent email enumeration
        PasswordResetService.create_reset_token(args["email"])
        return {"message": "If an account exists with this email, a reset link has been sent"}


@blp.route("/reset-password/<token>")
class ValidateResetTokenResource(MethodView):
    @blp.response(200, ValidateResetTokenResponseSchema)
    @blp.doc(
        summary="Validate reset token",
        description="Check if password reset token is valid",
        responses={
            200: {"description": "Token is valid"},
            400: {"description": "Invalid or expired token"},
        },
    )
    def get(self, token):
        """Validate reset token"""
        try:
            from api.services.password_reset import PasswordResetService
            result = PasswordResetService.validate_reset_token(token)
            if not result["valid"]:
                abort(400, message=result["reason"])
            return {"valid": True, "email": result["email"]}
        except Exception:
            abort(400, message="Invalid token")


@blp.route("/reset-password")
class ResetPasswordResource(MethodView):
    @blp.arguments(ResetPasswordSchema)
    @blp.response(200)
    @blp.doc(
        summary="Reset password",
        description="Set new password using reset token",
        responses={
            200: {"description": "Password reset successfully"},
            400: {"description": "Invalid token or password"},
        },
    )
    def post(self, args):
        """Reset password with token"""
        try:
            from api.services.password_reset import PasswordResetService
            user = PasswordResetService.reset_password(args["token"], args["password"])
            return {"message": "Password reset successfully", "email": user.email}
        except ValueError as e:
            abort(400, message=str(e))
