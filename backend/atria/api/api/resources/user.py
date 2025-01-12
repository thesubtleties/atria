from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.extensions import db
from api.models import User
from api.api.schemas import (
    UserSchema,
    UserDetailSchema,
    UserUpdateSchema,
    EventSchema,
    SessionSchema,
)


class UserResource(Resource):
    """
    Single user operations
    ---
    get:
      tags:
        - users
      summary: Get user profile
      description: Get detailed information about a user
      parameters:
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
          description: Numeric ID of the user
      responses:
        200:
          description: User details retrieved successfully
          content:
            application/json:
              schema: UserDetailSchema
        403:
          description: Not authorized to view this user
        404:
          description: User not found

    put:
      tags:
        - users
      summary: Update user profile
      description: Update user's own profile information
      parameters:
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
          description: Numeric ID of the user to update
      requestBody:
        required: true
        content:
          application/json:
            schema: UserUpdateSchema
      responses:
        200:
          description: Profile updated successfully
          content:
            application/json:
              schema: UserDetailSchema
        403:
          description: Can only update own profile
        404:
          description: User not found
    """

    @jwt_required()
    def get(self, user_id):
        """Get user profile"""
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)

        # Can view if:
        # 1. It's your own profile
        if current_user_id == user_id:
            return UserDetailSchema().dump(user)

        # 2. You share any events
        shared_events = (
            Event.query.join(EventUser)
            .filter(EventUser.user_id.in_([current_user_id, user_id]))
            .group_by(Event.id)
            .having(db.func.count(distinct(EventUser.user_id)) > 1)
            .all()
        )

        # 3. You're an admin in any of their orgs
        is_org_admin = any(
            current_user.is_org_admin(org.id) for org in user.organizations
        )

        if shared_events or is_org_admin:
            return UserDetailSchema().dump(user)

        return {"message": "Not authorized to view this profile"}, 403

    @jwt_required()
    def put(self, user_id):
        """Update user profile"""
        current_user_id = get_jwt_identity()

        # Can only update own profile
        if current_user_id != user_id:
            return {"message": "Can only update own profile"}, 403

        user = User.query.get_or_404(user_id)
        user = UserUpdateSchema().load(
            request.json, instance=user, partial=True
        )
        db.session.commit()

        return UserDetailSchema().dump(user)


class UserEventsResource(Resource):
    """
    User's events operations
    ---
    get:
      tags:
        - users
      summary: Get user's events
      description: Get all events a user is participating in
      parameters:
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
          description: Numeric ID of the user
        - in: query
          name: role
          schema:
            type: string
          description: Filter by role in event (optional)
      responses:
        200:
          description: List of user's events
          content:
            application/json:
              schema:
                type: object
                properties:
                  events:
                    type: array
                    items: EventSchema
        404:
          description: User not found
    """

    @jwt_required()
    def get(self, user_id):
        """Get user's events"""
        user = User.query.get_or_404(user_id)
        role = request.args.get("role")  # Optional role filter

        if role:
            events = user.get_events_by_role(role)
        else:
            events = user.events

        return {"events": EventSchema(many=True).dump(events)}


class UserSessionsResource(Resource):
    """
    User's speaking sessions operations
    ---
    get:
      tags:
        - users
      summary: Get user's speaking sessions
      description: Get all sessions where user is speaking
      parameters:
        - in: path
          name: user_id
          schema:
            type: integer
          required: true
          description: Numeric ID of the user
      responses:
        200:
          description: List of user's speaking sessions
          content:
            application/json:
              schema:
                type: object
                properties:
                  sessions:
                    type: array
                    items: SessionSchema
        404:
          description: User not found
    """

    @jwt_required()
    def get(self, user_id):
        """Get user's speaking sessions"""
        user = User.query.get_or_404(user_id)
        sessions = user.get_speaking_sessions()
        return {"sessions": SessionSchema(many=True).dump(sessions)}
