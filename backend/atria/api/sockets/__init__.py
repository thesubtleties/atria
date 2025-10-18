# api/sockets/__init__.py
from api.extensions import socketio
from flask_socketio import emit, join_room, disconnect
from flask_jwt_extended import decode_token
from flask import request, current_app
from .session_manager import session_manager, authenticated_only


@socketio.on("connect")
def handle_connect(auth=None):
    print(f"Client connecting: {request.sid}")
    print(f"Auth data received: {auth}")

    # Try multiple auth methods
    token = None
    
    # 1. Check auth object (best for WebSocket)
    if auth and isinstance(auth, dict) and 'token' in auth:
        token = auth['token']
        print("Token found in auth object")
    
    # 2. Check cookies (if using httpOnly cookies)
    if not token:
        from flask_jwt_extended import jwt_required, verify_jwt_in_request
        try:
            # This will check cookies automatically based on JWT_TOKEN_LOCATION config
            verify_jwt_in_request(optional=True)
            # If we get here, a valid token was found in cookies
            print("Token found in cookies")
            token = "cookie"  # We don't need the actual token, just need to know it's valid
        except:
            pass
    
    # 3. Check Authorization header (fallback for polling)
    if not token:
        auth_header = request.headers.get("Authorization")
        print(f"Auth header: {auth_header}")
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            print("Token found in Authorization header")
    
    if not token:
        print("No valid auth token found in any location")
        emit("auth_required", {"message": "Authentication required"})
        return

    try:
        # Get user ID based on auth method
        if token == "cookie":
            # Token was already verified by verify_jwt_in_request
            from flask_jwt_extended import get_jwt_identity
            user_id = get_jwt_identity()
        else:
            # Manually verify the token from auth object or header
            decoded_token = decode_token(token)
            user_id = decoded_token["sub"]

        # Authenticate the session
        session_manager.authenticate(request.sid, user_id)

        # Join user's personal room for direct messages
        join_room(f"user_{user_id}")

        # Join event rooms
        from api.models import User, EventUser

        user = User.query.get(user_id)
        if user:
            for event_user in user.event_users:
                join_room(f"event_{event_user.event_id}")

        emit(
            "connection_success",
            {"status": "authenticated", "user_id": user_id},
        )
    except Exception as e:
        print(f"Authentication failed: {str(e)}")
        emit("auth_error", {"message": f"Authentication failed: {str(e)}"})


@socketio.on("disconnect")
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")

    # Get user ID before removing session
    user_id = session_manager.get_user_id(request.sid)

    # Clean up session
    session_manager.remove_session(request.sid)

    # Clean up presence and typing indicators
    if user_id:
        from api.sockets.presence_notifications import cleanup_user_presence
        cleanup_user_presence(user_id)


@socketio.on("heartbeat")
def handle_heartbeat():
    if session_manager.is_authenticated(request.sid):
        session_manager.update_activity(request.sid)
        emit("heartbeat_response", {})


@socketio.on("join_event_admin")
@authenticated_only
def handle_join_event_admin(user_id, data):
    """
    Join event admin monitoring room.

    Allows admins to receive real-time updates about room presence,
    help requests, moderation alerts, etc. for an entire event.

    Args:
        user_id: Authenticated user ID
        data: {"event_id": int}
    """
    event_id = data.get("event_id")

    if not event_id:
        emit("error", {"message": "Missing event ID"})
        return

    # TODO: Verify user is admin of this event
    # For now, allow any authenticated user (will add permission check later)

    # Join the event admin monitoring room
    join_room(f"event_{event_id}_admin")

    # Emit all current room counts to hydrate the admin panel
    from api.sockets.presence_notifications import emit_all_room_counts_for_event
    emit_all_room_counts_for_event(event_id)

    emit("event_admin_joined", {"event_id": event_id})
    print(f"User {user_id} joined event_{event_id}_admin monitoring room")


# Simple test event
@socketio.on("ping")
@authenticated_only
def handle_ping(user_id, data):
    print(f"Ping from user {user_id}: {data}")
    emit("pong", {"message": "Pong!", "user_id": user_id, "received": data})


# Schedule periodic cleanup
def setup_socket_maintenance():
    try:
        from apscheduler.schedulers.background import BackgroundScheduler

        scheduler = BackgroundScheduler()
        scheduler.add_job(
            session_manager.cleanup_inactive,
            "interval",
            hours=1,
            kwargs={"timeout_hours": 24},
        )
        scheduler.start()
        print("Socket session cleanup scheduler started")
    except ImportError:
        print("APScheduler not installed, skipping session cleanup scheduling")


def register_socket_handlers():
    print("\nRegistering socket handlers\n")
    # Import socket event handlers
    from .chat import handle_get_chat_rooms, handle_join_chat_room
    from .direct_messages import handle_get_direct_message_threads
    from .connections import handle_get_connections

    print("Socket handlers imported successfully")


# Import all socket event handlers
# These imports should be at the bottom to avoid circular imports
try:
    # Import specific handlers instead of using wildcard imports
    from .chat import (
        handle_get_chat_rooms,
        handle_join_chat_room,
    )  # Add all handler functions here
    from .direct_messages import (
        handle_get_direct_message_threads,
    )  # Add all handler functions here
    from .connections import (
        handle_get_connections,
    )  # Add all handler functions here
except ImportError as e:
    print(f"Socket event handlers not found, error: {e}")
