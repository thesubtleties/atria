from flask import request, current_app
from flask_restful import Resource
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from api.extensions import db, pwd_context
from api.models import User, TokenBlocklist
from api.auth.helpers import add_token_to_database, revoke_token
from api.api.schemas import LoginSchema, SignupSchema


class AuthLoginResource(Resource):
    """
    User authentication
    ---
    post:
      tags:
        - auth
      summary: Authenticate user
      description: Authenticates user credentials and returns tokens
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  example: user@example.com
                password:
                  type: string
                  example: P4$$w0rd!
      responses:
        200:
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                    example: eyJ0eXAiOiJKV1QiLCJhbG...
                  refresh_token:
                    type: string
                    example: eyJ0eXAiOiJKV1QiLCJhbG...
        400:
          description: Invalid request format
        401:
          description: Invalid credentials
      security: []  # No auth required for login
    """

    def post(self):
        schema = LoginSchema()
        data = schema.load(request.json)

        user = User.query.filter_by(email=data["email"]).first()
        if not user or not user.verify_password(data["password"]):
            return {"message": "Invalid credentials"}, 401

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        add_token_to_database(
            access_token, current_app.config["JWT_IDENTITY_CLAIM"]
        )
        add_token_to_database(
            refresh_token, current_app.config["JWT_IDENTITY_CLAIM"]
        )

        return {"access_token": access_token, "refresh_token": refresh_token}


class AuthRefreshResource(Resource):
    """
    Token refresh
    ---
    post:
      tags:
        - auth
      summary: Refresh access token
      description: Get new access token using refresh token
      security:
        - jwt: []
      responses:
        200:
          description: Token refreshed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                    example: eyJ0eXAiOiJKV1QiLCJhbG...
        401:
          description: Invalid or expired refresh token
    """

    @jwt_required(refresh=True)
    def post(self):
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)
        add_token_to_database(
            access_token, current_app.config["JWT_IDENTITY_CLAIM"]
        )
        return {"access_token": access_token}


class AuthLogoutResource(Resource):
    """
    User logout
    ---
    post:
      tags:
        - auth
      summary: Logout user
      description: Revoke current access token
      security:
        - jwt: []
      responses:
        200:
          description: Successfully logged out
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Successfully logged out
        401:
          description: Invalid token
    """

    @jwt_required()
    def post(self):
        jti = get_jwt()["jti"]
        user_identity = get_jwt_identity()
        revoke_token(jti, user_identity)
        return {"message": "Successfully logged out"}


class AuthSignupResource(Resource):
    """
    User registration
    ---
    post:
      tags:
        - auth
      summary: Register new user
      description: Create new user account and return tokens
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  example: user@example.com
                password:
                  type: string
                  example: P4$$w0rd!
                first_name:
                  type: string
                  example: John
                last_name:
                  type: string
                  example: Doe
                company_name:
                  type: string
                  example: Acme Inc.
                title:
                  type: string
                  example: Software Engineer
      responses:
        201:
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: User created successfully
                  access_token:
                    type: string
                    example: eyJ0eXAiOiJKV1QiLCJhbG...
                  refresh_token:
                    type: string
                    example: eyJ0eXAiOiJKV1QiLCJhbG...
        400:
          description: Email already registered or invalid input
      security: []  # No auth required for signup
    """

    def post(self):
        schema = SignupSchema()
        data = schema.load(request.json)

        if User.query.filter_by(email=data["email"]).first():
            return {"message": "Email already registered"}, 400

        user = User(**data)
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

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
