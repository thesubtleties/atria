from functools import wraps
from flask_jwt_extended import get_jwt_identity
from api.models import User, Organization, Event, Session, ChatRoom
from api.models.enums import EventUserRole, OrganizationUserRole


# check if admin of organization (ie. can edit)
def org_admin_required():
    """Check if user is admin or owner of organization"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            org_id = kwargs.get("org_id")

            org = Organization.query.get_or_404(org_id)
            user_role = org.get_user_role(current_user)

            if user_role not in [
                OrganizationUserRole.OWNER,
                OrganizationUserRole.ADMIN,
            ]:
                return {
                    "message": "Must be owner or admin to perform this action"
                }, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def org_owner_required():
    """Check if user is specifically the owner of the organization"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            
            # Handle both org_id in kwargs and event_id (need to get org from event)
            org_id = kwargs.get("org_id")
            if not org_id and "event_id" in kwargs:
                event = Event.query.get_or_404(kwargs["event_id"])
                org_id = event.organization_id

            if not org_id:
                return {"message": "Organization context required"}, 400

            org = Organization.query.get_or_404(org_id)
            user_role = org.get_user_role(current_user)

            if user_role != OrganizationUserRole.OWNER:
                return {
                    "message": "Must be organization owner to perform this action"
                }, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def org_member_required():
    """Check if user is any member of organization"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            org_id = kwargs.get("org_id")

            org = Organization.query.get(org_id)
            if not org:
                return {
                    "message": f"Organization with id {org_id} not found"
                }, 404

            if not org.has_user(current_user):
                return {"message": "Not a member of this organization"}, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def event_member_required():
    """Check if user has any role in event (attendee, speaker, organizer, admin)"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)

            # Handle either direct event_id or get it from session
            event_id = kwargs.get("event_id")
            if not event_id and "session_id" in kwargs:
                session = Session.query.get_or_404(kwargs["session_id"])
                event_id = session.event_id

            if not event_id:
                return {"message": "No event ID found"}, 400

            event = Event.query.get_or_404(event_id)
            if not event.has_user(current_user):
                return {"message": "Not authorized to access this event"}, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


# check if organizer or admin of event (ie. can edit)
def event_organizer_required():
    """Check if user is organizer or admin of event"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)

            # Handle either direct event_id or get it from session
            event_id = kwargs.get("event_id")
            if not event_id and "session_id" in kwargs:
                session = Session.query.get_or_404(kwargs["session_id"])
                event_id = session.event_id

            event = Event.query.get_or_404(event_id)
            user_role = event.get_user_role(current_user)

            if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
                return {
                    "message": "Must be admin or organizer to perform this action"
                }, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


# check if admin of event (ie. can delete)
def event_admin_required():
    """Check if user is admin of event"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            event_id = kwargs.get("event_id")

            event = Event.query.get_or_404(event_id)
            user_role = event.get_user_role(current_user)

            if user_role != EventUserRole.ADMIN:
                return {"message": "Must be admin to perform this action"}, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def session_access_required():
    """Check if user has access to session's event"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            session_id = kwargs.get("session_id")

            session = Session.query.get_or_404(session_id)
            if not session.event.has_user(current_user):
                return {
                    "message": "Not authorized to access this session"
                }, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def chat_room_access_required():
    """Check if user has access to chat room's event"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            room_id = kwargs.get("room_id")

            chat_room = ChatRoom.query.get_or_404(room_id)
            event = Event.query.get_or_404(chat_room.event_id)

            if not event.has_user(current_user):
                return {
                    "message": "Not authorized to access this chat room"
                }, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator
