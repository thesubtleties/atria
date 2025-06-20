from api.extensions import socketio, db
from api.commons.socket_decorators import (
    socket_authenticated_only,
    socket_chat_room_access_required,
    socket_event_organizer_required,
)
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import get_jwt_identity
from api.models import User, Event
from api.models.enums import EventUserRole
from api.services.chat_room import ChatRoomService
from datetime import datetime, timezone


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
    if not ChatRoomService.check_room_access(room_id, user_id):
        emit("error", {"message": "Not authorized to join this chat room"})
        return

    chat_room = ChatRoomService.get_chat_room(room_id)
    join_room(f"room_{room_id}")

    # Get recent messages
    messages = ChatRoomService.get_recent_messages(room_id)

    emit(
        "chat_room_joined",
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
    emit("chat_room_left", {"room_id": room_id})


@socketio.on("chat_message")
@socket_chat_room_access_required
def handle_chat_message(user_id, data):
    print(f"Received chat_message event from user {user_id} with data: {data}")
    room_id = data.get("room_id")
    content = data.get("content")

    if not content or content.strip() == "":
        emit("error", {"message": "Message content cannot be empty"})
        return

    # Save message and get formatted response
    message = ChatRoomService.send_message(room_id, user_id, content)
    message_data = ChatRoomService.format_message_for_response(message)

    # Broadcast to room
    emit("new_chat_message", message_data, room=f"room_{room_id}")
    
    # Send confirmation to sender
    emit("chat_message_sent", message_data)


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

    try:
        result = ChatRoomService.delete_message(message_id, user_id)
        # Notify room that message was deleted
        emit(
            "chat_message_deleted",
            {"message_id": result["message_id"]},
            room=f"room_{result['room_id']}",
        )
    except ValueError as e:
        emit("error", {"message": str(e)})
    except Exception as e:
        emit("error", {"message": "Message not found"})


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
    room_data = {
        "name": name,
        "description": description,
        "is_global": is_global,
    }
    chat_room = ChatRoomService.create_chat_room(event_id, room_data)

    # Format response
    room_data = ChatRoomService.format_room_for_response(chat_room)

    # Notify event participants
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

    try:
        room_data = {"name": name}
        if description is not None:
            room_data["description"] = description

        chat_room = ChatRoomService.update_chat_room(
            room_id, room_data, user_id
        )

        # Format response
        room_data = ChatRoomService.format_room_for_response(chat_room)
        room_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Notify event participants
        emit(
            "chat_room_updated", room_data, room=f"event_{chat_room.event_id}"
        )
        emit("chat_room_update_confirmed", room_data)
    except ValueError as e:
        emit("error", {"message": str(e)})
    except Exception:
        emit("error", {"message": "Chat room not found"})


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

    try:
        # Delete and get event_id for notifications
        event_id = ChatRoomService.delete_chat_room(room_id, user_id)

        # Notify event participants
        emit(
            "chat_room_deleted", {"room_id": room_id}, room=f"event_{event_id}"
        )
        emit("chat_room_delete_confirmed", {"room_id": room_id})
    except ValueError as e:
        emit("error", {"message": str(e)})
    except Exception:
        emit("error", {"message": "Chat room not found"})


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
    chat_rooms = ChatRoomService.get_event_chat_rooms(event_id)

    # Format rooms for response
    rooms = []
    for room in chat_rooms:
        rooms.append(ChatRoomService.format_room_for_response(room))

    emit("chat_rooms", {"event_id": event_id, "rooms": rooms})
