from api.extensions import socketio, db
from api.commons.socket_decorators import socket_authenticated_only
from flask_socketio import emit, join_room
from flask_jwt_extended import get_jwt_identity
from api.models import DirectMessageThread, DirectMessage, User, Connection
from api.models.enums import MessageStatus, ConnectionStatus
from datetime import datetime


@socketio.on("get_direct_message_threads")
@socket_authenticated_only
def handle_get_direct_message_threads(user_id, data):
    print(
        f"Received get_direct_message_threads event from user {user_id} with data: {data}"
    )

    # Get all threads for the user
    threads = (
        DirectMessageThread.query.filter(
            (DirectMessageThread.user1_id == user_id)
            | (DirectMessageThread.user2_id == user_id)
        )
        .order_by(DirectMessageThread.last_message_at.desc())
        .all()
    )

    # Format threads for response
    thread_list = []
    for thread in threads:
        # Get the other user in the conversation
        other_user_id = (
            thread.user2_id if thread.user1_id == user_id else thread.user1_id
        )
        other_user = User.query.get(other_user_id)

        # Get the last message
        last_message = (
            DirectMessage.query.filter_by(thread_id=thread.id)
            .order_by(DirectMessage.created_at.desc())
            .first()
        )

        # Get unread count
        unread_count = (
            DirectMessage.query.filter_by(
                thread_id=thread.id, status=MessageStatus.DELIVERED
            )
            .filter(DirectMessage.sender_id != user_id)
            .count()
        )

        thread_data = {
            "id": thread.id,
            "is_encrypted": thread.is_encrypted,
            "created_at": thread.created_at.isoformat(),
            "last_message_at": thread.last_message_at.isoformat(),
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "image_url": other_user.image_url,
            },
            "unread_count": unread_count,
        }

        if last_message:
            thread_data["last_message"] = {
                "id": last_message.id,
                "sender_id": last_message.sender_id,
                "content": last_message.content,
                "created_at": last_message.created_at.isoformat(),
                "status": last_message.status.value,
            }

        thread_list.append(thread_data)

    emit("direct_message_threads", {"threads": thread_list})


@socketio.on("get_direct_messages")
@socket_authenticated_only
def handle_get_direct_messages(user_id, data):
    print(
        f"Received get_direct_messages event from user {user_id} with data: {data}"
    )
    thread_id = data.get("thread_id")

    if not thread_id:
        emit("error", {"message": "Missing thread ID"})
        return

    # Verify user has access to this thread
    thread = DirectMessageThread.query.get(thread_id)
    if not thread:
        emit("error", {"message": "Thread not found"})
        return

    print(f"User ID: {user_id} (type: {type(user_id)})")
    print(
        f"Thread user1_id: {thread.user1_id} (type: {type(thread.user1_id)})"
    )
    print(
        f"Thread user2_id: {thread.user2_id} (type: {type(thread.user2_id)})"
    )

    print(f"{user_id} - {thread.user1_id} - {thread.user2_id}")
    if thread.user1_id != user_id and thread.user2_id != user_id:
        emit("error", {"message": "Not authorized to view these messages"})
        return

    # Get messages with pagination
    page = data.get("page", 1)
    per_page = min(data.get("per_page", 50), 100)

    messages_query = DirectMessage.query.filter_by(
        thread_id=thread_id
    ).order_by(DirectMessage.created_at.desc())

    # Calculate total and pages
    total = messages_query.count()
    total_pages = (total + per_page - 1) // per_page

    # Get paginated messages
    messages = (
        messages_query.offset((page - 1) * per_page).limit(per_page).all()
    )

    # Format messages for response
    message_list = []
    for message in reversed(messages):  # Reverse to get chronological order
        sender = User.query.get(message.sender_id)
        message_list.append(
            {
                "id": message.id,
                "thread_id": message.thread_id,
                "sender_id": message.sender_id,
                "sender": {
                    "id": sender.id,
                    "full_name": sender.full_name,
                    "image_url": sender.image_url,
                },
                "content": message.content,
                "encrypted_content": message.encrypted_content,
                "status": message.status.value,
                "created_at": message.created_at.isoformat(),
            }
        )

    # Mark unread messages as read
    unread_messages = (
        DirectMessage.query.filter_by(
            thread_id=thread_id, status=MessageStatus.DELIVERED
        )
        .filter(DirectMessage.sender_id != user_id)
        .all()
    )

    for message in unread_messages:
        message.status = MessageStatus.READ

    db.session.commit()

    # Get the other user in the conversation
    other_user_id = (
        thread.user2_id if thread.user1_id == user_id else thread.user1_id
    )
    other_user = User.query.get(other_user_id)

    emit(
        "direct_messages",
        {
            "thread_id": thread_id,
            "messages": message_list,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
            },
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "image_url": other_user.image_url,
            },
            "is_encrypted": thread.is_encrypted,
        },
    )


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

    # Verify user has access to this thread
    thread = DirectMessageThread.query.get(thread_id)
    if not thread:
        emit("error", {"message": "Thread not found"})
        return

    if thread.user1_id != user_id and thread.user2_id != user_id:
        emit(
            "error",
            {"message": "Not authorized to send messages in this thread"},
        )
        return

    # Verify users are connected
    other_user_id = (
        thread.user2_id if thread.user1_id == user_id else thread.user1_id
    )
    current_user = User.query.get(user_id)

    if not current_user.is_connected_with(other_user_id):
        emit(
            "error",
            {
                "message": "You must be connected with this user to send messages"
            },
        )
        return

    # Create the message
    message = DirectMessage(
        thread_id=thread_id,
        sender_id=user_id,
        content=content,
        encrypted_content=encrypted_content if thread.is_encrypted else None,
        status=MessageStatus.DELIVERED,
    )

    db.session.add(message)

    # Update thread's last_message_at
    thread.last_message_at = datetime.utcnow()

    db.session.commit()

    # Get sender for response
    sender = User.query.get(user_id)

    # Prepare message data
    message_data = {
        "id": message.id,
        "thread_id": message.thread_id,
        "sender_id": message.sender_id,
        "sender": {
            "id": sender.id,
            "full_name": sender.full_name,
            "image_url": sender.image_url,
        },
        "content": message.content,
        "encrypted_content": message.encrypted_content,
        "status": message.status.value,
        "created_at": message.created_at.isoformat(),
    }

    # Send to recipient
    emit("new_direct_message", message_data, room=f"user_{other_user_id}")
    # Send to sender
    emit("new_direct_message", message_data, room=f"user_{user_id}")
    # Confirm to sender
    emit("direct_message_sent", message_data)


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

    # Verify user has access to this thread
    thread = DirectMessageThread.query.get(thread_id)
    if not thread:
        emit("error", {"message": "Thread not found"})
        return

    if thread.user1_id != user_id and thread.user2_id != user_id:
        emit("error", {"message": "Not authorized to access this thread"})
        return

    # Mark unread messages as read
    unread_messages = (
        DirectMessage.query.filter_by(
            thread_id=thread_id, status=MessageStatus.DELIVERED
        )
        .filter(DirectMessage.sender_id != user_id)
        .all()
    )

    for message in unread_messages:
        message.status = MessageStatus.READ

    db.session.commit()

    # Get the other user in the conversation
    other_user_id = (
        thread.user2_id if thread.user1_id == user_id else thread.user1_id
    )

    # Notify the sender that their messages were read
    emit(
        "messages_read",
        {"thread_id": thread_id, "reader_id": user_id},
        room=f"user_{other_user_id}",
    )

    emit("messages_marked_read", {"thread_id": thread_id})
