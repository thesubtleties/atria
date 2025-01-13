from flask import request
from flask_restful import Resource
from flask_jwt_extended import (  # JWT tools we need
    create_access_token,  # Creates new access token
    create_refresh_token,  # Creates new refresh token
    jwt_required,  # Protects routes
    get_jwt_identity,  # Gets user ID from token
    get_jwt,  # Gets full token data
)
from api.extensions import db
from api.models import User, TokenBlocklist
from api.api.schemas import LoginSchema, SignupSchema


class SignupResource(Resource):
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
            schema: SignupSchema
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
    """

    def post(self):
        # Load and validate signup data using our schema
        schema = SignupSchema()
        data = schema.load(request.json)

        # Check if email is already registered
        if User.query.filter_by(email=data["email"]).first():
            return {"message": "Email already registered"}, 400

        # Create new user (password will be hashed by User model)
        user = User(
            email=data["email"],
            password=data["password"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            company_name=data.get(
                "company_name"
            ),  # Optional fields use .get()
            title=data.get("title"),
        )

        # Save to database
        db.session.add(user)
        db.session.commit()

        # Generate tokens for automatic login after signup
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return {
            "message": "User created successfully",
            "access_token": access_token,
            "refresh_token": refresh_token,
        }, 201  # 201 = Created


class LoginResource(Resource):
    """
    User login
    ---
    post:
      tags:
        - auth
      summary: Login user
      description: Authenticate user and return tokens
      requestBody:
        required: true
        content:
          application/json:
            schema: LoginSchema
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
                  refresh_token:
                    type: string
        401:
          description: Invalid email or password
    """

    def post(self):
        # Load and validate login data
        schema = LoginSchema()
        data = schema.load(request.json)

        # Find user by email
        user = User.query.filter_by(email=data["email"]).first()

        # Check if user exists and password is correct
        if not user or not user.verify_password(data["password"]):
            return {"message": "Invalid email or password"}, 401

        # Generate new tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return {"access_token": access_token, "refresh_token": refresh_token}


class RefreshResource(Resource):
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
        401:
          description: Invalid refresh token
    """

    @jwt_required(
        refresh=True
    )  # Requires refresh token instead of access token
    def post(self):
        # Get user ID from refresh token
        current_user_id = get_jwt_identity()

        # Generate new access token
        new_access_token = create_access_token(identity=current_user_id)

        return {"access_token": new_access_token}


class LogoutResource(Resource):
    """
    User logout
    ---
    post:
      tags:
        - auth
      summary: Logout user
      description: Invalidate current access token
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

    @jwt_required()  # Requires valid access token
    def post(self):
        # Get token ID and user ID
        jti = get_jwt()["jti"]  # JWT ID
        user_id = get_jwt_identity()

        # Add token to blocklist so it can't be used again
        token = TokenBlocklist(
            jti=jti,
            token_type=token["type"],
            user_id=user_id,
            revoked=True,
            expires=datetime.fromtimestamp(token["exp"]),
        )
        db.session.add(token)
        db.session.commit()

        return {"message": "Successfully logged out"}
