from api.extensions import db
from api.models import Event, User, EventUser, Session, SessionSpeaker, Connection
from api.models.enums import EventUserRole, ConnectionStatus
from api.commons.pagination import paginate
from flask_jwt_extended import get_jwt_identity


class EventUserService:
    @staticmethod
    def add_or_create_user(event_id, data):
        """Add or create user and add to event"""
        # Check if user exists
        user = User.query.filter_by(email=data["email"]).first()

        if not user:
            # Create new user if they don't exist
            user = User(
                email=data["email"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                password=data.get("password", "changeme"),
            )
            db.session.add(user)
            db.session.flush()  # Get user ID without committing

        event = Event.query.get_or_404(event_id)

        if event.has_user(user):
            raise ValueError("User already in event")

        event.add_user(
            user,
            data["role"],
        )

        db.session.commit()

        return EventUser.query.filter_by(
            event_id=event_id, user_id=user.id
        ).first()

    @staticmethod
    def get_event_users(event_id, role=None, schema=None):
        """Get list of event users with optional role filter"""
        query = EventUser.query.filter_by(event_id=event_id)

        if role:
            query = query.filter_by(role=role)

        return paginate(query, schema, collection_name="event_users")
    
    @staticmethod
    def get_event_users_with_connection_status(event_id, role=None, schema=None):
        """Get list of event users with connection status relative to current user"""
        current_user_id = get_jwt_identity()
        
        # Get base query
        query = EventUser.query.filter_by(event_id=event_id)
        
        if role:
            query = query.filter_by(role=role)
        
        # Get paginated results first
        paginated_result = paginate(query, schema, collection_name="event_users")
        
        # Add connection status to each user
        if current_user_id:
            current_user_id = int(current_user_id)
            for event_user in paginated_result['event_users']:
                user_id = event_user.get('user_id')
                if user_id and user_id != current_user_id:
                    # Check for existing connection
                    connection = Connection.query.filter(
                        (
                            (Connection.requester_id == current_user_id) &
                            (Connection.recipient_id == user_id)
                        ) | (
                            (Connection.requester_id == user_id) &
                            (Connection.recipient_id == current_user_id)
                        )
                    ).first()
                    
                    if connection:
                        event_user['connection_status'] = connection.status.value
                        event_user['connection_id'] = connection.id
                        # Determine if current user sent or received the request
                        if connection.requester_id == current_user_id:
                            event_user['connection_direction'] = 'sent'
                        else:
                            event_user['connection_direction'] = 'received'
                    else:
                        event_user['connection_status'] = None
                        event_user['connection_id'] = None
                        event_user['connection_direction'] = None
                else:
                    # It's the current user or user_id is None
                    event_user['connection_status'] = None
                    event_user['connection_id'] = None
                    event_user['connection_direction'] = None
        
        return paginated_result

    @staticmethod
    def add_user_to_event(event_id, data):
        """Add existing user to event"""
        new_user = User.query.get_or_404(data["user_id"])
        event = Event.query.get_or_404(event_id)

        if event.has_user(new_user):
            raise ValueError("User already in event")

        event.add_user(
            new_user,
            data["role"],
            speaker_bio=data.get("speaker_bio"),
            speaker_title=data.get("speaker_title"),
        )
        db.session.commit()

        return EventUser.query.filter_by(
            event_id=event_id, user_id=new_user.id
        ).first()

    @staticmethod
    def update_user_role(event_id, user_id, update_data):
        """Update user's role or info in event"""
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first_or_404()

        if "role" in update_data:
            event_user.role = update_data["role"]

        if event_user.role == EventUserRole.SPEAKER:
            if "speaker_bio" in update_data:
                event_user.speaker_bio = update_data["speaker_bio"]
            if "speaker_title" in update_data:
                event_user.speaker_title = update_data["speaker_title"]

        db.session.commit()
        return event_user

    @staticmethod
    def remove_user_from_event(event_id, user_id):
        """Remove user from event"""
        event = Event.query.get_or_404(event_id)
        target_user = User.query.get_or_404(user_id)
        target_role = event.get_user_role(target_user)

        if (
            target_role == EventUserRole.ADMIN
            and len(
                [
                    eu
                    for eu in event.event_users
                    if eu.role == EventUserRole.ADMIN
                ]
            )
            <= 1
        ):
            raise ValueError("Cannot remove last admin")

        # Remove from sessions using subquery
        session_ids = Session.query.filter_by(event_id=event_id).with_entities(
            Session.id
        )
        SessionSpeaker.query.filter(
            SessionSpeaker.session_id.in_(session_ids),
            SessionSpeaker.user_id == user_id,
        ).delete(synchronize_session=False)

        # Then remove from event
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first_or_404()

        db.session.delete(event_user)
        db.session.commit()

        return {"message": "User removed from event"}

    @staticmethod
    def update_speaker_info(event_id, user_id, speaker_data):
        """Update speaker information"""
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id, role=EventUserRole.SPEAKER
        ).first_or_404()

        event_user.update_speaker_info(**speaker_data)
        db.session.commit()

        return event_user
