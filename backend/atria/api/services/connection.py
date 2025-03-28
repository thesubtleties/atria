from datetime import datetime
from api.extensions import db
from api.models import (
    Connection,
    User,
    Event,
    EventUser,
    DirectMessageThread,
    DirectMessage,
)
from api.models.enums import ConnectionStatus, MessageStatus
from api.commons.pagination import paginate


class ConnectionService:
    @staticmethod
    def get_user_connections(user_id, status=None, schema=None):
        """Get connections for a user with optional status filter"""
        # Build query for connections where user is either requester or recipient
        query = Connection.query.filter(
            (Connection.requester_id == user_id)
            | (Connection.recipient_id == user_id)
        )

        # Filter by status if provided
        if status:
            query = query.filter_by(status=status)

        # Order by created_at descending
        query = query.order_by(Connection.created_at.desc())

        if schema:
            return paginate(query, schema, collection_name="connections")

        return query.all()

    @staticmethod
    def get_pending_requests(user_id, schema=None):
        """Get pending connection requests received by a user"""
        query = Connection.query.filter_by(
            recipient_id=user_id, status=ConnectionStatus.PENDING
        ).order_by(Connection.created_at.desc())

        if schema:
            return paginate(query, schema, collection_name="connections")

        return query.all()

    @staticmethod
    def create_connection_request(
        requester_id,
        recipient_id,
        icebreaker_message,
        originating_event_id=None,
    ):
        """Create a new connection request"""
        # Check if recipient exists
        recipient = User.query.get_or_404(recipient_id)

        # Check if connection already exists
        existing = Connection.query.filter(
            (
                (Connection.requester_id == requester_id)
                & (Connection.recipient_id == recipient_id)
            )
            | (
                (Connection.requester_id == recipient_id)
                & (Connection.recipient_id == requester_id)
            )
        ).first()

        if existing:
            raise ValueError("Connection already exists")

        # If event_id is provided, verify both users are part of the event
        if originating_event_id:
            event = Event.query.get_or_404(originating_event_id)

            requester_in_event = EventUser.query.filter_by(
                event_id=originating_event_id, user_id=requester_id
            ).first()
            recipient_in_event = EventUser.query.filter_by(
                event_id=originating_event_id, user_id=recipient_id
            ).first()

            if not requester_in_event or not recipient_in_event:
                raise ValueError("Both users must be part of the event")

        # Create new connection
        connection = Connection(
            requester_id=requester_id,
            recipient_id=recipient_id,
            icebreaker_message=icebreaker_message,
            originating_event_id=originating_event_id,
            status=ConnectionStatus.PENDING,
        )

        db.session.add(connection)
        db.session.commit()

        return connection

    @staticmethod
    def get_connection(connection_id, user_id=None):
        """Get connection details, optionally verifying user access"""
        connection = Connection.query.get_or_404(connection_id)

        # If user_id provided, verify access
        if user_id and (
            connection.requester_id != user_id
            and connection.recipient_id != user_id
        ):
            raise ValueError("Not authorized to view this connection")

        return connection

    @staticmethod
    def update_connection_status(connection_id, user_id, new_status):
        """Update connection status (accept/reject)"""
        connection = Connection.query.get_or_404(connection_id)

        # Only recipient can accept/reject
        if connection.recipient_id != user_id:
            raise ValueError(
                "Only the recipient can accept or reject connections"
            )

        # Only pending connections can be updated
        if connection.status != ConnectionStatus.PENDING:
            raise ValueError("Only pending connections can be updated")

        # Update status
        connection.status = new_status
        connection.updated_at = datetime.utcnow()
        db.session.commit()

        # If accepted, create a direct message thread
        thread_id = None
        if new_status == ConnectionStatus.ACCEPTED:
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
                    status=MessageStatus.DELIVERED,
                )
                db.session.add(message)
                db.session.commit()

            thread_id = thread.id if thread else None

        return connection, thread_id

    @staticmethod
    def get_event_connections(user_id, event_id):
        """Get connected users in an event"""
        # Check if user is in event
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first()

        if not event_user:
            raise ValueError("Not authorized to access this event")

        # Get all users in the event
        event_users = EventUser.query.filter_by(event_id=event_id).all()
        event_user_ids = [eu.user_id for eu in event_users]

        # Get all connections for the user
        connections = Connection.query.filter(
            (
                (Connection.requester_id == user_id)
                | (Connection.recipient_id == user_id)
            )
            & (Connection.status == ConnectionStatus.ACCEPTED)
        ).all()

        # Filter to only those in the event
        event_connections = []
        for conn in connections:
            other_user_id = (
                conn.recipient_id
                if conn.requester_id == user_id
                else conn.requester_id
            )
            if other_user_id in event_user_ids:
                other_user = User.query.get(other_user_id)
                event_user = EventUser.query.filter_by(
                    event_id=event_id, user_id=other_user_id
                ).first()

                connection_data = {
                    "id": conn.id,
                    "user": {
                        "id": other_user.id,
                        "full_name": other_user.full_name,
                        "image_url": other_user.image_url,
                        "title": other_user.title,
                        "company_name": other_user.company_name,
                        "role": event_user.role.value if event_user else None,
                    },
                }

                # Get thread if it exists
                thread = DirectMessageThread.query.filter(
                    (
                        (DirectMessageThread.user1_id == user_id)
                        & (DirectMessageThread.user2_id == other_user_id)
                    )
                    | (
                        (DirectMessageThread.user1_id == other_user_id)
                        & (DirectMessageThread.user2_id == user_id)
                    )
                ).first()

                if thread:
                    connection_data["thread_id"] = thread.id

                event_connections.append(connection_data)

        return event_connections

    @staticmethod
    def format_connection_for_socket(connection, user_id):
        """Format connection data for socket response"""
        # Determine the other user
        other_user_id = (
            connection.recipient_id
            if connection.requester_id == user_id
            else connection.requester_id
        )
        other_user = User.query.get(other_user_id)

        connection_data = {
            "id": connection.id,
            "status": connection.status.value,
            "created_at": connection.created_at.isoformat(),
            "updated_at": (
                connection.updated_at.isoformat()
                if connection.updated_at
                else connection.created_at.isoformat()
            ),
            "icebreaker_message": connection.icebreaker_message,
            "is_requester": connection.requester_id == user_id,
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "image_url": other_user.image_url,
                "title": other_user.title,
                "company_name": other_user.company_name,
            },
        }

        if connection.originating_event_id:
            event = Event.query.get(connection.originating_event_id)
            if event:
                connection_data["originating_event"] = {
                    "id": event.id,
                    "title": event.title,
                }

        return connection_data

    @staticmethod
    def format_request_for_socket(connection):
        """Format connection request data for socket response"""
        requester = User.query.get(connection.requester_id)

        request_data = {
            "id": connection.id,
            "created_at": connection.created_at.isoformat(),
            "icebreaker_message": connection.icebreaker_message,
            "requester": {
                "id": requester.id,
                "full_name": requester.full_name,
                "image_url": requester.image_url,
                "title": requester.title,
                "company_name": requester.company_name,
            },
        }

        if connection.originating_event_id:
            event = Event.query.get(connection.originating_event_id)
            if event:
                request_data["originating_event"] = {
                    "id": event.id,
                    "title": event.title,
                }

        return request_data
