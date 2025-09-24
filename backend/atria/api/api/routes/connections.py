from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.api.schemas import (
    UserSchema,
    ConnectionSchema,
    ConnectionCreateSchema,
    ConnectionUpdateSchema,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
    paginate,
)
from api.models import User
from api.models.enums import ConnectionStatus
from api.services.connection import ConnectionService


blp = Blueprint(
    "connections",
    "connections",
    url_prefix="/api",
    description="Operations on user connections",
)


@blp.route("/connections")
class ConnectionList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List user connections",
        description="Get all connections for the current user",
        parameters=[
            {
                "in": "query",
                "name": "status",
                "schema": {"type": "string"},
                "description": "Filter by status (optional)",
                "enum": [status.value for status in ConnectionStatus],
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("connections", "ConnectionBase"),
        },
    )
    @jwt_required()
    def get(self):
        """Get user's connections"""
        user_id = int(get_jwt_identity())
        status = request.args.get("status")

        return ConnectionService.get_user_connections(
            user_id, status, ConnectionSchema(many=True)
        )

    @blp.arguments(ConnectionCreateSchema)
    @blp.response(201, ConnectionSchema)
    @blp.doc(
        summary="Create connection request",
        description="Send a connection request to another user",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "example": {"message": "Connection already exists"}
                    }
                },
            },
            404: {"description": "Recipient not found"},
        },
    )
    @jwt_required()
    def post(self, connection_data):
        """Create connection request"""
        user_id = int(get_jwt_identity())

        try:
            connection = ConnectionService.create_connection_request(
                user_id,
                connection_data["recipient_id"],
                connection_data["icebreaker_message"],
                connection_data.get("originating_event_id"),
            )
            return connection, 201
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/connections/<int:connection_id>")
class ConnectionDetail(MethodView):
    @blp.response(200, ConnectionSchema)
    @blp.doc(
        summary="Get connection details",
        responses={
            403: {"description": "Not authorized to view this connection"},
            404: {"description": "Connection not found"},
        },
    )
    @jwt_required()
    def get(self, connection_id):
        """Get connection details"""
        user_id = int(get_jwt_identity())

        try:
            return ConnectionService.get_connection(connection_id, user_id)
        except ValueError as e:
            abort(403, message=str(e))

    @blp.arguments(ConnectionUpdateSchema)
    @blp.response(200, ConnectionSchema)
    @blp.doc(
        summary="Update connection status",
        description="Accept or reject a connection request",
        responses={
            400: {"description": "Invalid status update"},
            403: {"description": "Not authorized to update this connection"},
            404: {"description": "Connection not found"},
        },
    )
    @jwt_required()
    def put(self, update_data, connection_id):
        """Update connection status"""
        user_id = int(get_jwt_identity())

        try:
            connection, _ = ConnectionService.update_connection_status(
                connection_id, user_id, update_data["status"]
            )
            return connection
        except ValueError as e:
            abort(400, message=str(e))
    
    @blp.response(204)
    @blp.doc(
        summary="Remove connection",
        description="Remove an accepted connection. Either party can remove the connection.",
        responses={
            204: {"description": "Connection removed successfully"},
            400: {"description": "Can only remove accepted connections"},
            403: {"description": "Not authorized to remove this connection"},
            404: {"description": "Connection not found"},
        },
    )
    @jwt_required()
    def delete(self, connection_id):
        """Remove connection"""
        user_id = int(get_jwt_identity())

        try:
            ConnectionService.remove_connection(connection_id, user_id)
            return '', 204
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/connections/pending")
class PendingConnectionList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List pending connection requests",
        description="Get all pending connection requests received by the current user",
        parameters=PAGINATION_PARAMETERS,
        responses={
            200: get_pagination_schema("connections", "ConnectionBase"),
        },
    )
    @jwt_required()
    def get(self):
        """Get pending connection requests"""
        user_id = int(get_jwt_identity())

        return ConnectionService.get_pending_requests(
            user_id, ConnectionSchema(many=True)
        )


@blp.route("/events/<int:event_id>/connections")
class EventConnectionList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List event connections",
        description="Get all users connected with the current user who are also in this event",
        parameters=PAGINATION_PARAMETERS,
        responses={
            200: get_pagination_schema("users", "UserBase"),
            403: {"description": "Not authorized to access this event"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    def get(self, event_id):
        """Get connected users in event"""
        user_id = int(get_jwt_identity())

        try:
            # Get the connections data
            event_connections = ConnectionService.get_event_connections(
                user_id, event_id
            )

            # Extract user IDs for pagination
            user_ids = [conn["user"]["id"] for conn in event_connections]

            # Create a query for pagination
            from sqlalchemy import func

            query = User.query.filter(User.id.in_(user_ids))

            # Apply pagination
            return paginate(
                query, UserSchema(many=True), collection_name="users"
            )

        except ValueError as e:
            return {"message": str(e)}, 403
