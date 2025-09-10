# api/api/sockets/direct_messages.py
from api.extensions import socketio
from api.commons.socket_decorators import socket_authenticated_only
from flask_socketio import emit, join_room
from api.services.direct_message import DirectMessageService
from api.models.user import User


@socketio.on("get_direct_message_threads")
@socket_authenticated_only
def handle_get_direct_message_threads(user_id, data):
    print(
        f"Received get_direct_message_threads event from user {user_id} with data: {data}"
    )

    # Get all threads for the user
    threads = DirectMessageService.get_user_threads(user_id)

    # Format threads for response
    thread_list = []
    for thread in threads:
        thread_data = DirectMessageService.format_thread_for_response(
            thread, user_id
        )
        thread_list.append(thread_data)

    emit("direct_message_threads", {"threads": thread_list})


@socketio.on("get_direct_messages")
@socket_authenticated_only
def handle_get_direct_messages(user_id, data):
    print(
        f"Received get_direct_messages event from user {user_id} with data: {data}"
    )
    thread_id = data.get("thread_id")
    page = data.get("page", 1)
    per_page = min(data.get("per_page", 50), 100)

    if not thread_id:
        emit("error", {"message": "Missing thread ID"})
        return

    try:
        # Use the unified service method for consistency with HTTP
        result = DirectMessageService.get_thread_messages_with_context(
            thread_id, user_id, page=page, per_page=per_page
        )
        
        emit("direct_messages", result)

    except ValueError as e:
        emit("error", {"message": str(e)})


@socketio.on("send_direct_message")
@socket_authenticated_only
def handle_send_direct_message(user_id, data):
    print(
        f"Received send_direct_message event from user {user_id} with data: {data}"
    )
    thread_id = data.get("thread_id")
    content = data.get("content")
    encrypted_content = data.get("encrypted_content")

    if not thread_id or not content:
        emit("error", {"message": "Missing required fields"})
        return

    try:
        # Create the message
        message, other_user_id = DirectMessageService.create_message(
            thread_id, user_id, content, encrypted_content
        )

        # Use centralized notification function
        from api.api.sockets.dm_notifications import emit_new_direct_message
        
        # Send to recipient
        emit_new_direct_message(message, thread_id, other_user_id)
        # Send to sender (in case they have multiple sessions)
        emit_new_direct_message(message, thread_id, user_id)
        
        # Confirm to sender
        message_data = DirectMessageService.format_message_for_response(message)
        emit("direct_message_sent", message_data)

    except ValueError as e:
        emit("error", {"message": str(e)})


@socketio.on("mark_messages_read")
@socket_authenticated_only
def handle_mark_messages_read(user_id, data):
    print(
        f"Received mark_messages_read event from user {user_id} with data: {data}"
    )
    thread_id = data.get("thread_id")

    if not thread_id:
        emit("error", {"message": "Missing thread ID"})
        return

    try:
        # Mark messages as read
        thread_id, other_user_id, had_unread = (
            DirectMessageService.mark_messages_read(thread_id, user_id)
        )

        # Only notify if there were unread messages
        if had_unread:
            # Use centralized notification function
            from api.api.sockets.dm_notifications import emit_messages_read
            emit_messages_read(thread_id, user_id, other_user_id)

        emit("messages_marked_read", {"thread_id": thread_id})

    except ValueError as e:
        emit("error", {"message": str(e)})


@socketio.on("toggle_encryption")
@socket_authenticated_only
def handle_toggle_encryption(user_id, data):
    print(
        f"Received toggle_encryption event from user {user_id} with data: {data}"
    )
    thread_id = data.get("thread_id")
    enable_encryption = data.get("enable_encryption", False)

    if not thread_id:
        emit("error", {"message": "Missing thread ID"})
        return

    try:
        # Toggle encryption
        thread = DirectMessageService.toggle_encryption(
            thread_id, user_id, enable_encryption
        )

        # Get the other user ID for notification
        other_user_id = (
            thread.user2_id if thread.user1_id == user_id else thread.user1_id
        )

        # Notify both users
        encryption_update = {
            "thread_id": thread_id,
            "is_encrypted": thread.is_encrypted,
            "updated_by": user_id,
        }

        # Notify the other user
        emit(
            "encryption_changed",
            encryption_update,
            room=f"user_{other_user_id}",
        )

        # Confirm to requester
        emit("encryption_updated", encryption_update)

    except ValueError as e:
        emit("error", {"message": str(e)})


@socketio.on("create_direct_message_thread")
@socket_authenticated_only
def handle_create_direct_message_thread(user_id, data):
    print(
        f"Received create_direct_message_thread event from user {user_id} with data: {data}"
    )
    other_user_id = data.get("user_id")
    event_id = data.get("event_id")  # Optional event context

    if not other_user_id:
        emit("error", {"message": "Missing user ID"})
        return
    
    # Debug: Check if someone is trying to message themselves
    if user_id == other_user_id:
        print(f"WARNING: User {user_id} is trying to create a thread with themselves!")
        emit("error", {"message": "Cannot create conversation with yourself"})
        return

    try:
        # Check if users are connected OR admin privilege in event
        current_user = User.query.get(user_id)
        is_connected = current_user.is_connected_with(other_user_id)
        
        if not is_connected:
            # If not connected, check for admin privilege if event_id provided
            if event_id:
                if not DirectMessageService.can_user_message_in_event_context(
                    user_id, other_user_id, event_id
                ):
                    emit(
                        "error",
                        {
                            "message": "You must be connected with this user to start a conversation"
                        },
                    )
                    return
            else:
                emit(
                    "error",
                    {
                        "message": "You must be connected with this user to start a conversation"
                    },
                )
                return

        # Get or create thread with appropriate scoping
        thread, is_new = DirectMessageService.get_or_create_thread(
            user_id, other_user_id, event_scope_id=event_id
        )

        # If it's a new thread, notify both users
        if is_new:
            from api.api.sockets.dm_notifications import emit_direct_message_thread_created
            emit_direct_message_thread_created(thread, user_id, other_user_id)
        else:
            # For existing threads, just confirm to the requester
            thread_data = DirectMessageService.format_thread_for_response(
                thread, user_id
            )
            thread_data["is_new"] = is_new
            emit("direct_message_thread_created", thread_data)

    except ValueError as e:
        emit("error", {"message": str(e)})
