# api/api/resources/user.py
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.extensions import db
from api.models import User
from api.api.schemas import (
    UserSchema,
    UserDetailSchema,
    UserCreateSchema,
    UserUpdateSchema,
)


class UserResource(Resource):
    """
    Single user operations
    ---
    get:
      tags:
        - users
      summary: Get user details
      parameters:
        - in: path
          name: user_id
          schema:
            type: integer
      responses:
        200:
          content:
            application/json:
              schema: UserDetailSchema
    put:
      tags:
        - users
      summary: Update user
      parameters:
        - in: path
          name: user_id
          schema:
            type: integer
      requestBody:
        content:
          application/json:
            schema: UserUpdateSchema
    """

    @jwt_required()
    def get(self, user_id):
        user = User.query.get_or_404(user_id)
        return UserDetailSchema().dump(user)

    @jwt_required()
    def put(self, user_id):
        # Only allow users to edit their own profile
        current_user_id = get_jwt_identity()
        if current_user_id != user_id:
            return {"message": "Not authorized"}, 403

        user = User.query.get_or_404(user_id)
        user = UserUpdateSchema().load(
            request.json, instance=user, partial=True
        )
        db.session.commit()
        return UserDetailSchema().dump(user)


class UserList(Resource):
    """
    User list operations
    ---
    get:
      tags:
        - users
      summary: List users
      parameters:
        - in: query
          name: organization_id
          schema:
            type: integer
          description: Filter by organization
        - in: query
          name: event_id
          schema:
            type: integer
          description: Filter by event
    post:
      tags:
        - users
      summary: Create user
      requestBody:
        content:
          application/json:
            schema: UserCreateSchema
    """

    @jwt_required()
    def get(self):
        schema = UserSchema(many=True)
        query = User.query

        # Add filters
        org_id = request.args.get("organization_id", type=int)
        event_id = request.args.get("event_id", type=int)

        if org_id:
            query = query.join(User.organization_users).filter_by(
                organization_id=org_id
            )
        if event_id:
            query = query.join(User.event_users).filter_by(event_id=event_id)

        return schema.dump(query.all())

    def post(self):
        schema = UserCreateSchema()
        user = schema.load(request.json)
        db.session.add(user)
        db.session.commit()
        return UserSchema().dump(user), 201


# Additional resources for specific user operations
class UserEventsResource(Resource):
    """Get user's events"""

    @jwt_required()
    def get(self, user_id):
        user = User.query.get_or_404(user_id)
        role = request.args.get("role")  # Optional role filter

        if role:
            events = user.get_events_by_role(role)
        else:
            events = user.events

        return {"events": EventSchema(many=True).dump(events)}


class UserSessionsResource(Resource):
    """Get user's speaking sessions"""

    @jwt_required()
    def get(self, user_id):
        user = User.query.get_or_404(user_id)
        sessions = user.get_speaking_sessions()
        return {"sessions": SessionSchema(many=True).dump(sessions)}
