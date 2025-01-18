from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from flask import request, current_app

from api.extensions import db
from api.models import User
from api.api.schemas import LoginSchema, SignupSchema, UserDetailSchema
from api.auth.helpers import add_token_to_database, revoke_token

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
        user = User.query.filter_by(email=login_data["email"]).first()
        if not user or not user.verify_password(login_data["password"]):
            return {"message": "Invalid credentials"}, 401

        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        # Add tokens to blocklist database (unrevoked)
        add_token_to_database(
            access_token, current_app.config["JWT_IDENTITY_CLAIM"]
        )
        add_token_to_database(
            refresh_token, current_app.config["JWT_IDENTITY_CLAIM"]
        )

        return {"access_token": access_token, "refresh_token": refresh_token}


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
        user_id = int(get_jwt_identity())
        user = User.query.get_or_404(user_id)
        return user


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
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)

        # Add new access token to blocklist database
        add_token_to_database(
            access_token, current_app.config["JWT_IDENTITY_CLAIM"]
        )

        return {"access_token": access_token}


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
            jti = get_jwt()["jti"]
            user_identity = get_jwt_identity()
            revoke_token(jti, user_identity)
            return {"message": "Successfully logged out"}
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
        if User.query.filter_by(email=signup_data["email"]).first():
            return {"message": "Email already registered"}, 400

        user = User(**signup_data)
        db.session.add(user)
        db.session.commit()

        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        # Add tokens to blocklist database
        add_token_to_database(
            access_token, current_app.config["JWT_IDENTITY_CLAIM"]
        )
        add_token_to_database(
            refresh_token, current_app.config["JWT_IDENTITY_CLAIM"]
        )

        return {
            "message": "User created successfully",
            "access_token": access_token,
            "refresh_token": refresh_token,
        }, 201
