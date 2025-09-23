from functools import wraps
from flask_jwt_extended import get_jwt_identity
from flask_smorest import abort
from api.models import User, Organization, Event, Session, ChatRoom, EventUser
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
                abort(403, message="Must be owner or admin to perform this action")

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
                abort(400, message="Organization context required")

            org = Organization.query.get_or_404(org_id)
            user_role = org.get_user_role(current_user)

            if user_role != OrganizationUserRole.OWNER:
                abort(403, message="Must be organization owner to perform this action")

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
                abort(404, message=f"Organization with id {org_id} not found")

            if not org.user_can_access(current_user):
                abort(403, message="Not a member of this organization")

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def event_member_required():
    """Check if user has any role in event and is not banned

    #! NOTE: Organization owners automatically pass this check via Event.user_can_access()
    #! which grants them access to all events in their organization.
    """

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
                abort(400, message="No event ID found")

            event = Event.query.get_or_404(event_id)
            if not event.user_can_access(current_user):
                abort(403, message="Not authorized to access this event")

            # Check if user is banned from the event
            event_user = EventUser.query.filter_by(
                event_id=event_id,
                user_id=current_user_id
            ).first()

            if event_user and event_user.is_banned:
                abort(403, message="You have been banned from this event")

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def event_member_or_admin_required():
    """Check if user has any role in event - admins/organizers can access even if banned

    #! NOTE: Organization owners automatically pass this check via Event.user_can_access()
    #! and are treated as ADMINs via Event.get_user_role().
    """

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
                abort(400, message="No event ID found")

            event = Event.query.get_or_404(event_id)
            if not event.user_can_access(current_user):
                abort(403, message="Not authorized to access this event")

            # Get user's event role
            event_user = EventUser.query.filter_by(
                event_id=event_id,
                user_id=current_user_id
            ).first()

            # Allow access if user is admin/organizer even if banned,
            # or if user is not banned
            if event_user:
                is_admin_or_organizer = event_user.role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]
                if not is_admin_or_organizer and event_user.is_banned:
                    abort(403, message="You have been banned from this event")

            return f(*args, **kwargs)

        return decorated_function

    return decorator


# check if organizer or admin of event (ie. can edit)
def event_organizer_required():
    """Check if user is organizer or admin of event
    
    #! NOTE: Organization owners automatically pass this check as Event.get_user_role()
    #! returns EventUserRole.ADMIN for org owners, granting them full event control.
    """

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
                abort(403, message="Must be admin or organizer to perform this action")

            return f(*args, **kwargs)

        return decorated_function

    return decorator


# check if admin of event (ie. can delete)
def event_admin_required():
    """Check if user is admin of event
    
    #! NOTE: Organization owners automatically pass this check as Event.get_user_role()
    #! returns EventUserRole.ADMIN for org owners.
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            event_id = kwargs.get("event_id")

            event = Event.query.get_or_404(event_id)
            user_role = event.get_user_role(current_user)

            if user_role != EventUserRole.ADMIN:
                abort(403, message="Must be admin to perform this action")

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def session_access_required():
    """Check if user has access to session's event

    #! NOTE: Organization owners have access via Event.user_can_access() which includes
    #! org owner checks.
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            session_id = kwargs.get("session_id")

            session = Session.query.get_or_404(session_id)
            if not session.event.user_can_access(current_user):
                return {
                    "message": "Not authorized to access this session"
                }, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def chat_room_access_required():
    """Check if user has access to chat room based on event membership and room type

    #! NOTE: Organization owners have access via Event.user_can_access() which includes
    #! org owner checks. They are treated as ADMIN role for room type checks.
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            room_id = kwargs.get("room_id")

            chat_room = ChatRoom.query.get_or_404(room_id)
            event = Event.query.get_or_404(chat_room.event_id)

            # First check basic event access
            if not event.user_can_access(current_user):
                abort(403, message="Not authorized to access this chat room")

            # Get user's role in the event for room type checking
            event_user = EventUser.query.filter_by(
                event_id=chat_room.event_id,
                user_id=current_user_id
            ).first()

            # If no EventUser record but has access, they're likely org owner (treated as ADMIN)
            user_role = event.get_user_role(current_user) if not event_user else event_user.role

            # Check room type access based on role
            from api.models.enums import ChatRoomType

            if chat_room.room_type == ChatRoomType.ADMIN:
                # Admin room - only admins and organizers
                if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
                    abort(403, message="Only admins and organizers can access admin rooms")

            elif chat_room.room_type == ChatRoomType.GREEN_ROOM:
                # Green room - speakers, admins, and organizers
                if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER, EventUserRole.SPEAKER]:
                    abort(403, message="Only speakers, admins, and organizers can access the green room")

            elif chat_room.room_type == ChatRoomType.BACKSTAGE:
                # Backstage (session-specific) - speakers of THIS session, admins, and organizers
                if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
                    # Not an admin/organizer, check if they're a speaker for this specific session
                    if chat_room.session and not chat_room.session.has_speaker(current_user):
                        abort(403, message="Only session speakers and organizers can access backstage rooms")

            # GLOBAL and PUBLIC rooms are accessible to all event members (already passed event access check)

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def event_organizer_or_org_owner_required():
    """Check if user is event organizer/admin OR organization owner"""

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
            
            # First check event role
            user_role = event.get_user_role(current_user)
            if user_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
                return f(*args, **kwargs)
            
            # Then check if user is organization owner
            org = Organization.query.get(event.organization_id)
            org_role = org.get_user_role(current_user)
            if org_role == OrganizationUserRole.OWNER:
                return f(*args, **kwargs)

            return {
                "message": "Must be event organizer/admin or organization owner"
            }, 403

        return decorated_function

    return decorator


def event_admin_or_org_owner_required():
    """Check if user is event admin OR organization owner"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            current_user = User.query.get_or_404(current_user_id)
            event_id = kwargs.get("event_id")

            event = Event.query.get_or_404(event_id)
            
            # First check event role
            user_role = event.get_user_role(current_user)
            if user_role == EventUserRole.ADMIN:
                return f(*args, **kwargs)
            
            # Then check if user is organization owner
            org = Organization.query.get(event.organization_id)
            org_role = org.get_user_role(current_user)
            if org_role == OrganizationUserRole.OWNER:
                return f(*args, **kwargs)

            return {
                "message": "Must be event admin or organization owner"
            }, 403

        return decorated_function

    return decorator
