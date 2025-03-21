# api/sockets/__init__.py
from api.extensions import socketio
from api.commons.socket_decorators import socket_authenticated_only
from flask_jwt_extended import get_jwt_identity
from flask_socketio import join_room


# Basic connection handlers
@socketio.on("connect")
@socket_authenticated_only
def handle_connect():
    user_id = get_jwt_identity()
    print(f"Client connected! User ID: {user_id}")

    # Join user's personal room for direct messages
    join_room(f"user_{user_id}")

    # Join event rooms for this user
    from api.models import User, EventUser

    user = User.query.get(user_id)
    if user:
        for event_user in user.event_users:
            join_room(f"event_{event_user.event_id}")

    # Emit success response
    from flask_socketio import emit

    emit("connection_success", {"status": "connected", "user_id": user_id})


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected!")
    # Additional disconnection logic


# Import all socket event handlers
# These imports should be at the bottom to avoid circular imports
from api.sockets.chat import *
from api.sockets.direct_messages import *
from api.sockets.connections import *
