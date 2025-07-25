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
    message_data = ChatRoomService.format_message_for_response(message)
    socketio.emit("new_chat_message", message_data, room=f"room_{room_id}")


def emit_chat_message_deleted(message_id, room_id):
    """
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