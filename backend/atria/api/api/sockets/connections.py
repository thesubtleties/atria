from api.extensions import socketio, db
from api.commons.socket_decorators import socket_authenticated_only
from flask_socketio import emit
from flask_jwt_extended import get_jwt_identity
from api.models import (
    Connection,
    User,
    DirectMessageThread,
    DirectMessage,
    Event,
    EventUser,
)
from api.models.enums import ConnectionStatus, MessageStatus
from datetime import datetime


@socketio.on("get_connections")
@socket_authenticated_only
def handle_get_connections(user_id, data):
    print(
        f"Received get_connections event from user {user_id} with data: {data}"
    )
    status = data.get("status", ConnectionStatus.ACCEPTED.value)

    # Get connections where user is either requester or recipient
    connections = (
        Connection.query.filter(
            (
                (Connection.requester_id == user_id)
                | (Connection.recipient_id == user_id)
            )
            & (Connection.status == status)
        )
        .order_by(Connection.updated_at.desc())
        .all()
    )

    # Format connections for response
    connection_list = []
    for conn in connections:
        # Determine the other user
        other_user_id = (
            conn.recipient_id
            if conn.requester_id == user_id
            else conn.requester_id
        )
        other_user = User.query.get(other_user_id)

        connection_data = {
            "id": conn.id,
            "status": conn.status.value,
            "created_at": conn.created_at.isoformat(),
            "updated_at": (
                conn.updated_at.isoformat()
                if conn.updated_at
                else conn.created_at.isoformat()
            ),
            "icebreaker_message": conn.icebreaker_message,
            "is_requester": conn.requester_id == user_id,
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "image_url": other_user.image_url,
                "title": other_user.title,
                "company_name": other_user.company_name,
            },
        }

        if conn.originating_event_id:
            event = Event.query.get(conn.originating_event_id)
            if event:
                connection_data["originating_event"] = {
                    "id": event.id,
                    "title": event.title,
                }

        connection_list.append(connection_data)

    emit("connections", {"status": status, "connections": connection_list})


@socketio.on("get_pending_requests")
@socket_authenticated_only
def handle_get_pending_requests(user_id, data):
    print(
        f"Received get_pending_requests event from user {user_id} with data: {data}"
    )

    # Get pending connection requests received by this user
    pending_requests = (
        Connection.query.filter_by(
            recipient_id=user_id, status=ConnectionStatus.PENDING
        )
        .order_by(Connection.created_at.desc())
        .all()
    )

    # Format requests for response
    request_list = []
    for req in pending_requests:
        requester = User.query.get(req.requester_id)

        request_data = {
            "id": req.id,
            "created_at": req.created_at.isoformat(),
            "icebreaker_message": req.icebreaker_message,
            "requester": {
                "id": requester.id,
                "full_name": requester.full_name,
                "image_url": requester.image_url,
                "title": requester.title,
                "company_name": requester.company_name,
            },
        }

        if req.originating_event_id:
            event = Event.query.get(req.originating_event_id)
            if event:
                request_data["originating_event"] = {
                    "id": event.id,
                    "title": event.title,
                }

        request_list.append(request_data)

    emit("pending_requests", {"requests": request_list})


@socketio.on("send_connection_request")
@socket_authenticated_only
def handle_send_connection_request(user_id, data):
    print(
        f"Received send_connection_request event from user {user_id} with data: {data}"
    )
    recipient_id = data.get("recipient_id")
    icebreaker_message = data.get("icebreaker_message")
    originating_event_id = data.get("event_id")  # Optional

    if not recipient_id or not icebreaker_message:
        emit("error", {"message": "Missing required fields"})
        return

    # Check if recipient exists
    recipient = User.query.get(recipient_id)
    if not recipient:
        emit("error", {"message": "Recipient not found"})
        return

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
        emit(
            "error",
            {
                "message": "Connection already exists",
                "connection": {
                    "id": existing.id,
                    "status": existing.status.value,
                },
            },
        )
        return

    # If event_id is provided, verify both users are part of the event
    if originating_event_id:
        event = Event.query.get(originating_event_id)
        if not event:
            emit("error", {"message": "Event not found"})
            return

        requester_in_event = EventUser.query.filter_by(
            event_id=originating_event_id, user_id=user_id
        ).first()
        recipient_in_event = EventUser.query.filter_by(
            event_id=originating_event_id, user_id=recipient_id
        ).first()

        if not requester_in_event or not recipient_in_event:
            emit("error", {"message": "Both users must be part of the event"})
            return

    # Create connection request
    connection = Connection(
        requester_id=user_id,
        recipient_id=recipient_id,
        icebreaker_message=icebreaker_message,
        originating_event_id=originating_event_id,
        status=ConnectionStatus.PENDING,
    )

    db.session.add(connection)
    db.session.commit()

    # Get requester for notification
    requester = User.query.get(user_id)

    # Prepare connection data
    connection_data = {
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

    if originating_event_id:
        event = Event.query.get(originating_event_id)
        if event:
            connection_data["originating_event"] = {
                "id": event.id,
                "title": event.title,
            }

    # Notify recipient
    emit(
        "new_connection_request", connection_data, room=f"user_{recipient_id}"
    )

    # Confirm to requester
    emit(
        "connection_request_sent",
        {
            "id": connection.id,
            "recipient_id": recipient_id,
            "status": connection.status.value,
        },
    )


@socketio.on("respond_to_connection_request")
@socket_authenticated_only
def handle_respond_to_connection_request(user_id, data):
    print(
        f"Received respond_to_connection_request event from user {user_id} with data: {data}"
    )
    connection_id = data.get("connection_id")
    accept = data.get("accept", False)

    if not connection_id:
        emit("error", {"message": "Missing connection ID"})
        return

    # Get the connection
    connection = Connection.query.get(connection_id)
    if not connection:
        emit("error", {"message": "Connection request not found"})
        return

    # Verify user is the recipient
    if connection.recipient_id != user_id:
        emit(
            "error",
            {
                "message": "Not authorized to respond to this connection request"
            },
        )
        return

    # Verify connection is pending
    if connection.status != ConnectionStatus.PENDING:
        emit(
            "error",
            {"message": "Connection request has already been processed"},
        )
        return

    # Update status
    connection.status = (
        ConnectionStatus.ACCEPTED if accept else ConnectionStatus.REJECTED
    )
    connection.updated_at = datetime.utcnow()
    db.session.commit()

    # If accepted, create a direct message thread
    thread_id = None
    if accept:
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

        thread_id = thread.id

    # Notify requester
    response_data = {
        "connection_id": connection.id,
        "status": connection.status.value,
        "updated_at": connection.updated_at.isoformat(),
    }

    if thread_id:
        response_data["thread_id"] = thread_id

    emit(
        "connection_response",
        response_data,
        room=f"user_{connection.requester_id}",
    )

    # Confirm to recipient
    emit(
        "connection_response_sent",
        {
            "connection_id": connection.id,
            "status": connection.status.value,
            "thread_id": thread_id,
        },
    )


@socketio.on("get_event_connections")
@socket_authenticated_only
def handle_get_event_connections(user_id, data):
    print(
        f"Received get_event_connections event from user {user_id} with data: {data}"
    )
    event_id = data.get("event_id")

    if not event_id:
        emit("error", {"message": "Missing event ID"})
        return

    # Check if user is part of the event
    event_user = EventUser.query.filter_by(
        event_id=event_id, user_id=user_id
    ).first()
    if not event_user:
        emit("error", {"message": "Not authorized to access this event"})
        return

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

    emit(
        "event_connections",
        {"event_id": event_id, "connections": event_connections},
    )
