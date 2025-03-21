# api/api/routes/connections.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.extensions import db
from api.models import Connection, User, Event
from api.models.enums import ConnectionStatus
from api.api.schemas import (
    ConnectionSchema,
    ConnectionCreateSchema,
    ConnectionUpdateSchema,
)
from api.commons.pagination import (
    paginate,
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)

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

        # Build query for connections where user is either requester or recipient
        query = Connection.query.filter(
            (Connection.requester_id == user_id)
            | (Connection.recipient_id == user_id)
        )

        # Filter by status if provided
        status = request.args.get("status")
        if status:
            query = query.filter_by(status=status)

        # Order by created_at descending
        query = query.order_by(Connection.created_at.desc())

        return paginate(
            query, ConnectionSchema(many=True), collection_name="connections"
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
        recipient_id = connection_data["recipient_id"]

        # Check if recipient exists
        recipient = User.query.get_or_404(recipient_id)

        # Check if connection already exists
        existing = Connection.query.filter(
            (
                (Connection.requester_id == user_id)
                & (Connection.recipient_id == recipient_id)
            )
            | (
                (Connection.requester_id == recipient_id)
                & (Connection.recipient_id == user_id)
            )
        ).first()

        if existing:
            return {"message": "Connection already exists"}, 400

        # Create new connection
        connection = Connection(
            requester_id=user_id,
            recipient_id=recipient_id,
            icebreaker_message=connection_data["icebreaker_message"],
            originating_event_id=connection_data.get("originating_event_id"),
            status=ConnectionStatus.PENDING,
        )

        db.session.add(connection)
        db.session.commit()

        return connection, 201


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

        connection = Connection.query.get_or_404(connection_id)

        # Check if user is part of this connection
        if (
            connection.requester_id != user_id
            and connection.recipient_id != user_id
        ):
            return {"message": "Not authorized to view this connection"}, 403

        return connection

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

        connection = Connection.query.get_or_404(connection_id)

        # Only recipient can accept/reject
        if connection.recipient_id != user_id:
            return {
                "message": "Only the recipient can accept or reject connections"
            }, 403

        # Only pending connections can be updated
        if connection.status != ConnectionStatus.PENDING:
            return {"message": "Only pending connections can be updated"}, 400

        # Update status
        connection.status = update_data["status"]
        db.session.commit()

        # If accepted, create a direct message thread
        if connection.status == ConnectionStatus.ACCEPTED:
            from api.models import DirectMessageThread, DirectMessage

            # Check if thread already exists
            thread = DirectMessageThread.query.filter(
                (
                    (DirectMessageThread.user1_id == connection.requester_id)
                    & (DirectMessageThread.user2_id == connection.recipient_id)
                )
                | (
                    (DirectMessageThread.user1_id == connection.recipient_id)
                    & (DirectMessageThread.user2_id == connection.requester_id)
                )
            ).first()

            if not thread:
                # Create new thread
                thread = DirectMessageThread(
                    user1_id=connection.requester_id,
                    user2_id=connection.recipient_id,
                    is_encrypted=False,
                )
                db.session.add(thread)
                db.session.flush()

                # Add initial message with the icebreaker
                message = DirectMessage(
                    thread_id=thread.id,
                    sender_id=connection.requester_id,
                    content=connection.icebreaker_message,
                    status="DELIVERED",
                )
                db.session.add(message)
                db.session.commit()

        return connection


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

        query = Connection.query.filter_by(
            recipient_id=user_id, status=ConnectionStatus.PENDING
        ).order_by(Connection.created_at.desc())

        return paginate(
            query, ConnectionSchema(many=True), collection_name="connections"
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
        current_user = User.query.get_or_404(user_id)

        # Check if user is in event
        event = Event.query.get_or_404(event_id)
        if not event.has_user(current_user):
            return {"message": "Not authorized to access this event"}, 403

        # Get connected users in event
        connected_users = current_user.get_connected_users_in_event(event_id)

        # Convert to a query for pagination
        from sqlalchemy import func

        user_ids = [user.id for user in connected_users]
        query = User.query.filter(User.id.in_(user_ids))

        # Apply pagination
        from api.schemas.user import UserSchema

        return paginate(query, UserSchema(many=True), collection_name="users")
