# api/api/sockets/chat_notifications.py
"""
Centralized chat notification functions that can be called from both 
REST routes and Socket.IO handlers. These functions handle all Socket.IO
emissions related to chat functionality.
"""
from api.extensions import socketio
from api.services.chat_room import ChatRoomService


def emit_new_chat_message(message, room_id):
    """
    Emit a new chat message to all users in a chat room.
    Can be called from both REST routes and socket handlers.
    
    Args:
        message: ChatMessage instance
        room_id: ID of the chat room
    """
    from api.models import ChatRoom, Event, EventUser
    from api.models.enums import EventUserRole
    
    # Get the chat room and event
    chat_room = ChatRoom.query.get(room_id)
    if not chat_room:
        return
    
    event = Event.query.get(chat_room.event_id)
    if not event:
        return
    
    # Get all users in the room and format message based on their role
    event_users = EventUser.query.filter_by(event_id=event.id).all()
    
    for event_user in event_users:
        user_socket_room = f"user_{event_user.user_id}"
        
        # Include deletion info for admins/organizers
        include_deletion_info = event_user.role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]
        message_data = ChatRoomService.format_message_for_response(message, include_deletion_info)
        
        socketio.emit("new_chat_message", message_data, room=user_socket_room)


def emit_chat_message_moderated(message_id, room_id, deleted_by_user):
    """
    Emit role-specific events for message moderation.
    
    Args:
        message_id: ID of moderated message
        room_id: ID of the chat room
        deleted_by_user: User object who deleted the message
    """
    from api.models import ChatRoom, Event, EventUser
    from api.models.enums import EventUserRole
    
    # Get the chat room and event
    chat_room = ChatRoom.query.get(room_id)
    if not chat_room:
        return
    
    event = Event.query.get(chat_room.event_id)
    if not event:
        return
    
    # Get all users in the room and emit different events based on their role
    event_users = EventUser.query.filter_by(event_id=event.id).all()
    
    for event_user in event_users:
        user_socket_room = f"user_{event_user.user_id}"
        
        if event_user.role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            # Admins/Organizers see the message as moderated with full info
            socketio.emit(
                "chat_message_moderated",
                {
                    "message_id": message_id,
                    "room_id": room_id,
                    "deleted_by": {
                        "id": deleted_by_user.id,
                        "full_name": deleted_by_user.full_name
                    }
                },
                room=user_socket_room
            )
        else:
            # Other users see the message as removed
            socketio.emit(
                "chat_message_removed",
                {
                    "message_id": message_id,
                    "room_id": room_id
                },
                room=user_socket_room
            )


def emit_chat_message_deleted(message_id, room_id):
    """
    Legacy function - use emit_chat_message_moderated instead.
    Notify room that a message was deleted.
    
    Args:
        message_id: ID of deleted message
        room_id: ID of the chat room
    """
    socketio.emit(
        "chat_message_deleted",
        {"message_id": message_id},
        room=f"room_{room_id}"
    )


def emit_chat_room_created(chat_room, event_id):
    """
    Notify event participants about new chat room.
    
    Args:
        chat_room: ChatRoom instance
        event_id: ID of the event
    """
    room_data = ChatRoomService.format_room_for_response(chat_room)
    socketio.emit("chat_room_created", room_data, room=f"event_{event_id}")


def emit_chat_room_updated(chat_room):
    """
    Notify event participants about chat room updates.
    
    Args:
        chat_room: Updated ChatRoom instance
    """
    room_data = ChatRoomService.format_room_for_response(chat_room)
    socketio.emit(
        "chat_room_updated", 
        room_data, 
        room=f"event_{chat_room.event_id}"
    )


def emit_chat_room_deleted(room_id, event_id):
    """
    Notify event participants about chat room deletion.
    
    Args:
        room_id: ID of deleted room
        event_id: ID of the event
    """
    socketio.emit(
        "chat_room_deleted", 
        {"room_id": room_id}, 
        room=f"event_{event_id}"
    )


def emit_user_joined_room(user_id, room_id):
    """
    Notify room about user joining.
    
    Args:
        user_id: ID of user who joined
        room_id: ID of the chat room
    """
    socketio.emit(
        "user_joined_room",
        {"user_id": user_id, "room_id": room_id},
        room=f"room_{room_id}"
    )


def emit_user_left_room(user_id, room_id):
    """
    Notify room about user leaving.
    
    Args:
        user_id: ID of user who left
        room_id: ID of the chat room
    """
    socketio.emit(
        "user_left_room",
        {"user_id": user_id, "room_id": room_id},
        room=f"room_{room_id}"
    )


def emit_bulk_chat_rooms_updated(event_id, updates):
    """
    Notify event participants about bulk chat room updates.
    
    Args:
        event_id: ID of the event
        updates: Dictionary of updates applied to rooms
    """
    socketio.emit(
        "bulk_chat_rooms_updated",
        {"event_id": event_id, "updates": updates},
        room=f"event_{event_id}"
    )