"""
Centralized presence and typing notification functions

These functions can be called from both REST routes and Socket.IO handlers.
They handle all Socket.IO emissions related to presence and typing indicators.

Architecture Pattern:
- Service layer (PresenceService/TypingService) handles Redis operations
- This module handles Socket.IO emissions
- Separation of concerns: data management vs real-time notifications

Future Enhancement: Database Persistence for Analytics
- DB checkpoints every 5 minutes (last_seen_at updates)
- Final duration calculation on disconnect
- Background cleanup for crash/network drop scenarios
- Enables reports: session engagement, chat activity, user analytics
"""

from api.extensions import socketio
from api.services.presence_service import PresenceService
from api.services.typing_service import TypingService
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# CHAT ROOM PRESENCE
# ============================================================================

def emit_room_user_count(room_id: int, event_id: int = None):
    """
    Broadcast current user count to all users in a room AND to event admins.

    Used for "health meter" UI showing room activity level.
    Frontend can color-code based on count/percentage of total attendees.

    Args:
        room_id: Chat room ID
        event_id: Event ID (optional, for admin monitoring)
    """
    try:
        user_count = PresenceService.get_room_user_count(room_id)

        data = {
            "room_id": room_id,
            "user_count": user_count
        }

        # Emit to users actively in the room
        socketio.emit("room_user_count", data, room=f"room_{room_id}")

        # Also emit to event admins for monitoring
        if event_id:
            socketio.emit("room_user_count", data, room=f"event_{event_id}_admin")

        logger.debug(f"Emitted room_user_count for room {room_id}: {user_count}")

    except Exception as e:
        logger.error(f"Error emitting room_user_count: {e}")


def emit_all_room_counts_for_event(event_id: int):
    """
    Broadcast current user counts for ALL rooms in an event to admin monitoring channel.

    Called when admin loads the admin panel to hydrate initial presence state.
    Sends current count for every room in the event via socket.

    Args:
        event_id: Event ID
    """
    try:
        from api.models import ChatRoom

        # Get all rooms for this event
        rooms = ChatRoom.query.filter_by(event_id=event_id).all()

        for room in rooms:
            user_count = PresenceService.get_room_user_count(room.id)

            socketio.emit(
                "room_user_count",
                {
                    "room_id": room.id,
                    "user_count": user_count
                },
                room=f"event_{event_id}_admin"
            )

        logger.debug(f"Emitted all room counts for event {event_id}: {len(rooms)} rooms")

    except Exception as e:
        logger.error(f"Error emitting all room counts for event {event_id}: {e}")


def emit_user_joined_room(room_id: int, user_id: int):
    """
    Notify room about user join and updated count.

    Args:
        room_id: Chat room ID
        user_id: User ID who joined
    """
    try:
        user_count = PresenceService.get_room_user_count(room_id)

        socketio.emit(
            "user_joined_room",
            {
                "room_id": room_id,
                "user_count": user_count
            },
            room=f"room_{room_id}"
        )

        # TODO: Future DB persistence hook
        # ChatActivityService.record_join(user_id, room_id, timestamp)

        logger.debug(f"User {user_id} joined room {room_id}, count: {user_count}")

    except Exception as e:
        logger.error(f"Error emitting user_joined_room: {e}")


def emit_user_left_room(room_id: int, user_id: int):
    """
    Notify room about user leave and updated count.

    Args:
        room_id: Chat room ID
        user_id: User ID who left
    """
    try:
        user_count = PresenceService.get_room_user_count(room_id)

        socketio.emit(
            "user_left_room",
            {
                "room_id": room_id,
                "user_count": user_count
            },
            room=f"room_{room_id}"
        )

        # TODO: Future DB persistence hook
        # ChatActivityService.record_leave(user_id, room_id, timestamp)
        # Calculate duration, store in DB for analytics

        logger.debug(f"User {user_id} left room {room_id}, count: {user_count}")

    except Exception as e:
        logger.error(f"Error emitting user_left_room: {e}")


# ============================================================================
# SESSION VIEWING PRESENCE
# ============================================================================

def emit_session_viewer_count(session_id: int):
    """
    Broadcast current viewer count for a session.

    Used for live viewer count on session pages and admin dashboards.
    Critical for event organizers to gauge session engagement in real-time.

    Args:
        session_id: Session ID
    """
    try:
        viewer_count = PresenceService.get_session_viewer_count(session_id)

        socketio.emit(
            "session_viewer_count",
            {
                "session_id": session_id,
                "viewer_count": viewer_count
            },
            room=f"session_{session_id}"
        )

        logger.debug(f"Emitted session_viewer_count for session {session_id}: {viewer_count}")

    except Exception as e:
        logger.error(f"Error emitting session_viewer_count: {e}")


def emit_user_joined_session(session_id: int, user_id: int):
    """
    Notify session about new viewer.

    Args:
        session_id: Session ID
        user_id: User ID who started viewing
    """
    try:
        viewer_count = PresenceService.get_session_viewer_count(session_id)

        socketio.emit(
            "user_joined_session",
            {
                "session_id": session_id,
                "viewer_count": viewer_count
            },
            room=f"session_{session_id}"
        )

        # TODO: Future DB persistence hook
        # SessionViewService.record_view_start(user_id, session_id, timestamp)
        # INSERT into session_view_events (user_id, session_id, joined_at)

        logger.debug(f"User {user_id} joined session {session_id}, viewers: {viewer_count}")

    except Exception as e:
        logger.error(f"Error emitting user_joined_session: {e}")


def emit_user_left_session(session_id: int, user_id: int):
    """
    Notify session about viewer leaving.

    Args:
        session_id: Session ID
        user_id: User ID who stopped viewing
    """
    try:
        viewer_count = PresenceService.get_session_viewer_count(session_id)

        socketio.emit(
            "user_left_session",
            {
                "session_id": session_id,
                "viewer_count": viewer_count
            },
            room=f"session_{session_id}"
        )

        # TODO: Future DB persistence hook
        # SessionViewService.record_view_end(user_id, session_id, timestamp)
        # UPDATE session_view_events SET left_at = ?, duration_seconds = ?
        # WHERE user_id = ? AND session_id = ? AND left_at IS NULL

        logger.debug(f"User {user_id} left session {session_id}, viewers: {viewer_count}")

    except Exception as e:
        logger.error(f"Error emitting user_left_session: {e}")


# ============================================================================
# GLOBAL ONLINE PRESENCE
# ============================================================================

def emit_user_online_status(user_id: int, is_online: bool):
    """
    Broadcast user's online/offline status.

    This is for the "green dot" on DM lists showing who's currently in the app.
    Only sent to users who can see this user (connections, event participants).

    Args:
        user_id: User ID
        is_online: True if user came online, False if went offline
    """
    try:
        # Emit to user's personal room (for their own clients)
        socketio.emit(
            "user_online_status",
            {
                "user_id": user_id,
                "is_online": is_online
            },
            room=f"user_{user_id}"
        )

        # TODO: Emit to relevant audiences
        # - User's connections (for DM list green dots)
        # - Event rooms user is part of (for participant lists)
        # This requires looking up user's connections/events

        logger.debug(f"User {user_id} online status: {is_online}")

    except Exception as e:
        logger.error(f"Error emitting user_online_status: {e}")


# ============================================================================
# TYPING INDICATORS
# ============================================================================

def emit_typing_in_room(room_id: int, user_id: int, is_typing: bool):
    """
    Notify room participants about typing status.

    Sent to all users EXCEPT the typing user (they already know).
    Frontend should debounce (max once per 500ms) and auto-clear after 3s.

    Args:
        room_id: Chat room ID
        user_id: User ID who is typing
        is_typing: True if typing, False if stopped
    """
    try:
        # Update typing status in Redis
        TypingService.set_typing_in_room(room_id, user_id, is_typing)

        # Emit to room, excluding the typing user
        socketio.emit(
            "typing_in_room",
            {
                "room_id": room_id,
                "user_id": user_id,
                "is_typing": is_typing
            },
            room=f"room_{room_id}",
            include_self=False
        )

        logger.debug(f"User {user_id} typing in room {room_id}: {is_typing}")

    except Exception as e:
        logger.error(f"Error emitting typing_in_room: {e}")


def emit_typing_in_dm(thread_id: int, user_id: int, is_typing: bool, recipient_id: int):
    """
    Notify other user in DM thread about typing status.

    Args:
        thread_id: DM thread ID
        user_id: User ID who is typing
        is_typing: True if typing, False if stopped
        recipient_id: User ID of recipient
    """
    try:
        # Update typing status in Redis
        TypingService.set_typing_in_dm(thread_id, user_id, is_typing)

        # Send only to recipient (not the typing user)
        socketio.emit(
            "typing_in_dm",
            {
                "thread_id": thread_id,
                "user_id": user_id,
                "is_typing": is_typing
            },
            room=f"user_{recipient_id}"
        )

        logger.debug(f"User {user_id} typing in DM {thread_id}")

    except Exception as e:
        logger.error(f"Error emitting typing_in_dm: {e}")


# ============================================================================
# CLEANUP & MAINTENANCE
# ============================================================================

def cleanup_user_presence(user_id: int):
    """
    Clean up all presence and typing data for a user on disconnect.

    This removes them from:
    - All chat rooms they were in
    - All sessions they were viewing
    - Global online status
    - All typing indicators

    Also emits notifications to affected rooms/sessions so other users
    see the updates in real-time.

    Args:
        user_id: User ID to clean up
    """
    try:
        # Get rooms and sessions user is in before cleanup
        user_rooms = PresenceService.get_user_rooms(user_id)
        user_sessions = PresenceService.get_user_sessions(user_id)

        # Clean up presence
        rooms_cleaned = PresenceService.cleanup_user(user_id)

        # Clean up typing indicators
        typing_cleaned = TypingService.cleanup_user_typing(user_id)

        logger.info(
            f"Cleaned up user {user_id}: {rooms_cleaned} rooms/sessions, "
            f"{typing_cleaned} typing indicators"
        )

        # Emit leave events to all rooms
        for room_id in user_rooms:
            emit_user_left_room(room_id, user_id)

        # Emit leave events to all sessions
        for session_id in user_sessions:
            emit_user_left_session(session_id, user_id)

        # Update global online status
        emit_user_online_status(user_id, is_online=False)

        # TODO: Future DB persistence hook
        # Background job will catch any missed cleanup via TTL expiration
        # and write final durations to DB

    except Exception as e:
        logger.error(f"Error cleaning up presence for user {user_id}: {e}")
