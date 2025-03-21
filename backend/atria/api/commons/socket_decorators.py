# api/commons/socket_decorators.py

from functools import wraps
from flask_socketio import emit, disconnect
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from api.models import User, Event, ChatRoom
from api.models.enums import EventUserRole


def socket_authenticated_only(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Socket authentication error: {str(e)}")
            disconnect()

    return wrapped


def socket_event_member_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            current_user = User.query.get(user_id)

            if not current_user:
                emit("error", {"message": "User not found"})
                disconnect()
                return

            # Get event_id from the data
            data = args[0] if args else {}
            event_id = data.get("event_id")

            if not event_id:
                emit("error", {"message": "No event ID provided"})
                disconnect()
                return

            event = Event.query.get(event_id)
            if not event:
                emit("error", {"message": "Event not found"})
                disconnect()
                return

            if not event.has_user(current_user):
                emit(
                    "error", {"message": "Not authorized to access this event"}
                )
                disconnect()
                return

            return f(*args, **kwargs)
        except Exception as e:
            print(f"Socket auth error: {str(e)}")
            disconnect()

    return wrapped


def socket_chat_room_access_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            current_user = User.query.get(user_id)

            if not current_user:
                emit("error", {"message": "User not found"})
                disconnect()
                return

            # Get room_id from the data
            data = args[0] if args else {}
            room_id = data.get("room_id")

            if not room_id:
                emit("error", {"message": "No room ID provided"})
                return

            chat_room = ChatRoom.query.get(room_id)
            if not chat_room:
                emit("error", {"message": "Chat room not found"})
                return

            event = Event.query.get(chat_room.event_id)
            if not event.has_user(current_user):
                emit(
                    "error",
                    {"message": "Not authorized to access this chat room"},
                )
                return

            return f(*args, **kwargs)
        except Exception as e:
            print(f"Socket auth error: {str(e)}")
            disconnect()

    return wrapped


def socket_event_organizer_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            current_user = User.query.get(user_id)

            if not current_user:
                emit("error", {"message": "User not found"})
                disconnect()
                return

            # Get event_id from the data
            data = args[0] if args else {}
            event_id = data.get("event_id")

            if not event_id:
                emit("error", {"message": "No event ID provided"})
                return

            event = Event.query.get(event_id)
            if not event:
                emit("error", {"message": "Event not found"})
                return

            user_role = event.get_user_role(current_user)
            if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
                emit(
                    "error",
                    {
                        "message": "Must be admin or organizer to perform this action"
                    },
                )
                return

            return f(*args, **kwargs)
        except Exception as e:
            print(f"Socket auth error: {str(e)}")
            disconnect()

    return wrapped


def socket_event_admin_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            current_user = User.query.get(user_id)

            if not current_user:
                emit("error", {"message": "User not found"})
                disconnect()
                return

            # Get event_id from the data
            data = args[0] if args else {}
            event_id = data.get("event_id")

            if not event_id:
                emit("error", {"message": "No event ID provided"})
                return

            event = Event.query.get(event_id)
            if not event:
                emit("error", {"message": "Event not found"})
                return

            user_role = event.get_user_role(current_user)
            if user_role != EventUserRole.ADMIN:
                emit(
                    "error",
                    {"message": "Must be admin to perform this action"},
                )
                return

            return f(*args, **kwargs)
        except Exception as e:
            print(f"Socket auth error: {str(e)}")
            disconnect()

    return wrapped
