from api.extensions import socketio
from api.commons.socket_decorators import socket_authenticated_only
from flask_socketio import emit
from api.services.connection import ConnectionService
from api.models.enums import ConnectionStatus


@socketio.on("get_connections")
@socket_authenticated_only
def handle_get_connections(user_id, data):
    print(
        f"Received get_connections event from user {user_id} with data: {data}"
    )
    status = data.get("status", ConnectionStatus.ACCEPTED.value)

    # Get connections
    connections = ConnectionService.get_user_connections(user_id, status)

    # Format connections for response
    connection_list = []
    for conn in connections:
        connection_data = ConnectionService.format_connection_for_socket(
            conn, user_id
        )
        connection_list.append(connection_data)

    emit("connections", {"status": status, "connections": connection_list})


@socketio.on("get_pending_requests")
@socket_authenticated_only
def handle_get_pending_requests(user_id, data):
    print(
        f"Received get_pending_requests event from user {user_id} with data: {data}"
    )

    # Get pending connection requests
    pending_requests = ConnectionService.get_pending_requests(user_id)

    # Format requests for response
    request_list = []
    for req in pending_requests:
        request_data = ConnectionService.format_request_for_socket(req)
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

    try:
        # Create connection request
        connection = ConnectionService.create_connection_request(
            user_id, recipient_id, icebreaker_message, originating_event_id
        )

        # Format for notification
        connection_data = ConnectionService.format_request_for_socket(
            connection
        )

        # Notify recipient
        emit(
            "new_connection_request",
            connection_data,
            room=f"user_{recipient_id}",
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

    except ValueError as e:
        emit("error", {"message": str(e)})


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

    try:
        # Update connection status
        connection, thread_id = ConnectionService.update_connection_status(
            connection_id,
            user_id,
            ConnectionStatus.ACCEPTED if accept else ConnectionStatus.REJECTED,
        )

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

    except ValueError as e:
        emit("error", {"message": str(e)})


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

    try:
        # Get event connections
        event_connections = ConnectionService.get_event_connections(
            user_id, event_id
        )

        emit(
            "event_connections",
            {"event_id": event_id, "connections": event_connections},
        )

    except ValueError as e:
        emit("error", {"message": str(e)})
