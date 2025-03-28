from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required

from api.api.schemas import LoginSchema, SignupSchema, UserDetailSchema
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
            return {"message": str(e)}, 400


@blp.route("/signup")
class AuthSignupResource(MethodView):
    @blp.arguments(SignupSchema)
    @blp.response(201)
    @blp.doc(
        summary="Register new user",
        description="Create new user account and return tokens",
        responses={
            201: {
                "description": "User created successfully",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "message": {"type": "string"},
                                "access_token": {"type": "string"},
                                "refresh_token": {"type": "string"},
                            },
                        }
                    }
                },
            },
            400: {"description": "Email already registered or invalid input"},
        },
    )
    def post(self, signup_data):
        """Register new user"""
        try:
            result = AuthService.signup(signup_data)
            return result, 201
        except ValueError as e:
            return {"message": str(e)}, 400
