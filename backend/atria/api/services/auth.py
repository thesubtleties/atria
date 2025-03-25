from flask import current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
)

from api.extensions import db
from api.models import User
from api.auth.helpers import add_token_to_database, revoke_token


class AuthService:
    @staticmethod
    def login(login_data):
        """Authenticate user and generate tokens"""
        user = User.query.filter_by(email=login_data["email"]).first()
        if not user or not user.verify_password(login_data["password"]):
            raise ValueError("Invalid credentials")

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

    @staticmethod
    def get_current_user():
        """Get current authenticated user"""
        user_id = int(get_jwt_identity())
        return User.query.get_or_404(user_id)

    @staticmethod
    def refresh_token():
        """Generate new access token using refresh token"""
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)

        # Add new access token to blocklist database
        add_token_to_database(
            access_token, current_app.config["JWT_IDENTITY_CLAIM"]
        )

        return {"access_token": access_token}

    @staticmethod
    def logout():
        """Revoke current token"""
        jti = get_jwt()["jti"]
        user_identity = get_jwt_identity()
        revoke_token(jti, user_identity)
        return {"message": "Successfully logged out"}

    @staticmethod
    def signup(signup_data):
        """Register new user and generate tokens"""
        if User.query.filter_by(email=signup_data["email"]).first():
            raise ValueError("Email already registered")

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
        }
