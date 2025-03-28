# api/sockets/__init__.py
from api.extensions import socketio
from flask_socketio import emit, join_room, disconnect
from flask_jwt_extended import decode_token
from flask import request, current_app
from .session_manager import session_manager, authenticated_only


@socketio.on("connect")
def handle_connect():
    print(f"Client connecting: {request.sid}")

    # Get the auth token from the request headers
    auth_header = request.headers.get("Authorization")
    print(f"Auth header: {auth_header}")

    if not auth_header or not auth_header.startswith("Bearer "):
        print("No valid auth header found")
        emit("auth_required", {"message": "Authentication required"})
        return

    token = auth_header.split(" ")[1]

    try:
        # Manually verify the token
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
    session_manager.remove_session(request.sid)


@socketio.on("heartbeat")
def handle_heartbeat():
    if session_manager.is_authenticated(request.sid):
        session_manager.update_activity(request.sid)
        emit("heartbeat_response", {})


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
