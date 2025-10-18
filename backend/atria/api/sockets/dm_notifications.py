# api/api/sockets/dm_notifications.py
"""
Centralized direct message notification functions that can be called from both 
REST routes and Socket.IO handlers. These functions handle all Socket.IO
emissions related to direct messaging functionality.
"""
from api.extensions import socketio
from api.services.direct_message import DirectMessageService


def emit_new_direct_message(message, thread_id, recipient_id):
    """
    Emit a new direct message to the recipient.
    
    Args:
        message: DirectMessage instance
        thread_id: ID of the message thread
        recipient_id: ID of the recipient user
    """
    print(f"🔔 Emitting new message notification to user {recipient_id} in room user_{recipient_id}")
    
    try:
        message_data = DirectMessageService.format_message_for_response(message)
        print(f"📨 Message data: {message_data.get('content', 'NO_CONTENT')} from user {message_data.get('sender_id', 'NO_SENDER')}")
        
        # Emit to recipient's user room
        socketio.emit(
            "new_direct_message", 
            message_data, 
            room=f"user_{recipient_id}"
        )
        print(f"✅ Socket emission successful to user_{recipient_id}")
        
    except Exception as e:
        print(f"❌ Error in emit_new_direct_message: {e}")
        import traceback
        traceback.print_exc()


def emit_direct_message_thread_created(thread, user1_id, user2_id):
    """
    Notify both users about new thread creation.
    
    Args:
        thread: DirectMessageThread instance
        user1_id: ID of first user
        user2_id: ID of second user
    """
    # Format thread data for each user (shows the OTHER user in thread)
    thread_data_user1 = DirectMessageService.format_thread_for_response(thread, user1_id)
    thread_data_user2 = DirectMessageService.format_thread_for_response(thread, user2_id)
    
    # Emit to both users with their respective view of the thread
    socketio.emit(
        "direct_message_thread_created",
        thread_data_user1,
        room=f"user_{user1_id}"
    )
    socketio.emit(
        "direct_message_thread_created",
        thread_data_user2,
        room=f"user_{user2_id}"
    )


def emit_messages_read(thread_id, reader_id, other_user_id):
    """
    Notify the other user that messages have been read.
    
    Args:
        thread_id: ID of the message thread
        reader_id: ID of user who read the messages
        other_user_id: ID of the other user in the conversation
    """
    socketio.emit(
        "messages_read",
        {
            "thread_id": thread_id,
            "reader_id": reader_id
        },
        room=f"user_{other_user_id}"
    )


def emit_typing_status(thread_id, user_id, is_typing, recipient_id):
    """
    Notify typing status to the other user.
    
    Args:
        thread_id: ID of the message thread
        user_id: ID of user who is typing
        is_typing: Boolean indicating typing status
        recipient_id: ID of the recipient
    """
    socketio.emit(
        "typing_status",
        {
            "thread_id": thread_id,
            "user_id": user_id,
            "is_typing": is_typing
        },
        room=f"user_{recipient_id}"
    )


def emit_message_deleted(message_id, thread_id, recipient_id):
    """
    Notify about message deletion.
    
    Args:
        message_id: ID of deleted message
        thread_id: ID of the message thread
        recipient_id: ID of the recipient
    """
    socketio.emit(
        "direct_message_deleted",
        {
            "message_id": message_id,
            "thread_id": thread_id
        },
        room=f"user_{recipient_id}"
    )