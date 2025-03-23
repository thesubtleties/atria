from api.extensions import socketio, db
from api.commons.socket_decorators import (
    socket_authenticated_only,
    socket_chat_room_access_required,
    socket_event_organizer_required,
)
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import get_jwt_identity
from api.models import ChatRoom, ChatMessage, User, EventUser, Event
from api.models.enums import EventUserRole
from datetime import datetime


@socketio.on("join_chat_room")
@socket_authenticated_only
def handle_join_chat_room(user_id, data):
    print(
        f"Received join_chat_room event from user {user_id} with data: {data}"
    )
    room_id = data.get("room_id")

    if not room_id:
        emit("error", {"message": "Missing room ID"})
        return

    # Verify user has access to this room
    chat_room = ChatRoom.query.get(room_id)
    if not chat_room:
        emit("error", {"message": "Chat room not found"})
        return

    # Check if user is part of the event
    event_user = EventUser.query.filter_by(
        event_id=chat_room.event_id, user_id=user_id
    ).first()
    if not event_user:
        emit("error", {"message": "Not authorized to join this chat room"})
        return

    join_room(f"room_{room_id}")

    # Get recent messages
    recent_messages = (
        ChatMessage.query.filter_by(room_id=room_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(50)
        .all()
    )

    # Format messages for response
    messages = []
    for message in reversed(
        recent_messages
    ):  # Reverse to get chronological order
        user = User.query.get(message.user_id)
        messages.append(
            {
                "id": message.id,
                "room_id": message.room_id,
                "user_id": message.user_id,
                "user": {
                    "id": user.id,
                    "full_name": user.full_name,
                    "image_url": user.image_url,
                },
                "content": message.content,
                "created_at": message.created_at.isoformat(),
            }
        )

    emit(
        "room_joined",
        {
            "room_id": room_id,
            "room_name": chat_room.name,
            "messages": messages,
        },
    )


@socketio.on("leave_chat_room")
@socket_authenticated_only
def handle_leave_chat_room(user_id, data):
    print(
        f"Received leave_chat_room event from user {user_id} with data: {data}"
    )
    room_id = data.get("room_id")
    if not room_id:
        emit("error", {"message": "Missing room ID"})
        return

    leave_room(f"room_{room_id}")
    emit("room_left", {"room_id": room_id})


@socketio.on("chat_message")
@socket_chat_room_access_required
def handle_chat_message(user_id, data):
    print(f"Received chat_message event from user {user_id} with data: {data}")
    room_id = data.get("room_id")
    content = data.get("content")

    if not content or content.strip() == "":
        emit("error", {"message": "Message content cannot be empty"})
        return

    # Get the chat room
    chat_room = ChatRoom.query.get(room_id)

    # Save message to database
    message = ChatMessage(room_id=room_id, user_id=user_id, content=content)
    db.session.add(message)
    db.session.commit()

    # Get user for response
    user = User.query.get(user_id)

    # Broadcast to room
    message_data = {
        "id": message.id,
        "room_id": message.room_id,
        "user_id": message.user_id,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "image_url": user.image_url,
        },
        "content": message.content,
        "created_at": message.created_at.isoformat(),
    }

    emit("new_chat_message", message_data, room=f"room_{room_id}")


@socketio.on("delete_chat_message")
@socket_authenticated_only
def handle_delete_chat_message(user_id, data):
    print(
        f"Received delete_chat_message event from user {user_id} with data: {data}"
    )
    message_id = data.get("message_id")

    if not message_id:
        emit("error", {"message": "Missing message ID"})
        return

    # Get the message
    message = ChatMessage.query.get(message_id)
    if not message:
        emit("error", {"message": "Message not found"})
        return

    # Get the chat room and event
    chat_room = ChatRoom.query.get(message.room_id)
    event = Event.query.get(chat_room.event_id)

    # Check if user is the message sender or an admin/organizer/moderator
    current_user = User.query.get(user_id)
    user_role = event.get_user_role(current_user)

    if message.user_id != user_id and user_role not in [
        EventUserRole.ADMIN,
        EventUserRole.ORGANIZER,
        EventUserRole.MODERATOR,
    ]:
        emit("error", {"message": "Not authorized to delete this message"})
        return

    # Delete the message
    db.session.delete(message)
    db.session.commit()

    # Notify room that message was deleted
    emit(
        "chat_message_deleted",
        {"message_id": message_id},
        room=f"room_{message.room_id}",
    )


@socketio.on("create_chat_room")
@socket_authenticated_only
def handle_create_chat_room(user_id, data):
    print(
        f"Received create_chat_room event from user {user_id} with data: {data}"
    )
    event_id = data.get("event_id")
    name = data.get("name")
    description = data.get("description", "")
    is_global = data.get("is_global", False)

    if not all([event_id, name]):
        emit("error", {"message": "Missing required fields"})
        return

    # Check if user is an organizer or admin
    current_user = User.query.get(user_id)
    event = Event.query.get(event_id)

    if not event:
        emit("error", {"message": "Event not found"})
        return

    user_role = event.get_user_role(current_user)
    if user_role not in [
        EventUserRole.ADMIN,
        EventUserRole.ORGANIZER,
        EventUserRole.MODERATOR,
    ]:
        emit("error", {"message": "Not authorized to create chat rooms"})
        return

    # Create the chat room
    chat_room = ChatRoom(
        event_id=event_id,
        name=name,
        description=description,
        is_global=is_global,
    )

    db.session.add(chat_room)
    db.session.commit()

    # Notify event participants
    room_data = {
        "id": chat_room.id,
        "event_id": chat_room.event_id,
        "name": chat_room.name,
        "description": chat_room.description,
        "is_global": chat_room.is_global,
        "created_at": chat_room.created_at.isoformat(),
    }

    emit("new_chat_room", room_data, room=f"event_{event_id}")
    emit("chat_room_created", room_data)


@socketio.on("update_chat_room")
@socket_authenticated_only
def handle_update_chat_room(user_id, data):
    print(
        f"Received update_chat_room event from user {user_id} with data: {data}"
    )
    room_id = data.get("room_id")
    name = data.get("name")
    description = data.get("description")

    if not room_id or not name:
        emit("error", {"message": "Missing required fields"})
        return

    # Get the chat room
    chat_room = ChatRoom.query.get(room_id)
    if not chat_room:
        emit("error", {"message": "Chat room not found"})
        return

    # Check if user is an organizer or admin
    current_user = User.query.get(user_id)
    event = Event.query.get(chat_room.event_id)
    user_role = event.get_user_role(current_user)

    if user_role not in [
        EventUserRole.ADMIN,
        EventUserRole.ORGANIZER,
        EventUserRole.MODERATOR,
    ]:
        emit("error", {"message": "Not authorized to update chat rooms"})
        return

    # Update the chat room
    chat_room.name = name
    if description is not None:
        chat_room.description = description

    db.session.commit()

    # Notify event participants
    room_data = {
        "id": chat_room.id,
        "event_id": chat_room.event_id,
        "name": chat_room.name,
        "description": chat_room.description,
        "is_global": chat_room.is_global,
        "updated_at": datetime.utcnow().isoformat(),
    }

    emit("chat_room_updated", room_data, room=f"event_{chat_room.event_id}")
    emit("chat_room_update_confirmed", room_data)


@socketio.on("delete_chat_room")
@socket_authenticated_only
def handle_delete_chat_room(user_id, data):
    print(
        f"Received delete_chat_room event from user {user_id} with data: {data}"
    )
    room_id = data.get("room_id")

    if not room_id:
        emit("error", {"message": "Missing room ID"})
        return

    # Get the chat room
    chat_room = ChatRoom.query.get(room_id)
    if not chat_room:
        emit("error", {"message": "Chat room not found"})
        return

    # Check if user is an admin
    current_user = User.query.get(user_id)
    event = Event.query.get(chat_room.event_id)
    user_role = event.get_user_role(current_user)

    if user_role != EventUserRole.ADMIN:
        emit("error", {"message": "Only admins can delete chat rooms"})
        return

    # Store event_id before deletion
    event_id = chat_room.event_id

    # Delete the chat room (cascade will delete messages)
    db.session.delete(chat_room)
    db.session.commit()

    # Notify event participants
    emit("chat_room_deleted", {"room_id": room_id}, room=f"event_{event_id}")
    emit("chat_room_delete_confirmed", {"room_id": room_id})


@socketio.on("get_chat_rooms")
@socket_authenticated_only
def handle_get_chat_rooms(user_id, data):
    print(
        f"Received get_chat_rooms event from user {user_id} with data: {data}"
    )
    event_id = data.get("event_id")

    if not event_id:
        emit("error", {"message": "Missing event ID"})
        return

    # Check if user is part of the event
    current_user = User.query.get(user_id)
    event = Event.query.get(event_id)

    if not event:
        emit("error", {"message": "Event not found"})
        return

    if not event.has_user(current_user):
        emit("error", {"message": "Not authorized to access this event"})
        return

    # Get all chat rooms for the event
    chat_rooms = ChatRoom.query.filter_by(event_id=event_id).all()

    # Format rooms for response
    rooms = []
    for room in chat_rooms:
        rooms.append(
            {
                "id": room.id,
                "event_id": room.event_id,
                "name": room.name,
                "description": room.description,
                "is_global": room.is_global,
                "created_at": room.created_at.isoformat(),
            }
        )

    emit("chat_rooms", {"event_id": event_id, "rooms": rooms})
