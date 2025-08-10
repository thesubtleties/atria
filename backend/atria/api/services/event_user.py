from api.extensions import db
from api.models import Event, User, EventUser, Session, SessionSpeaker, Connection
from api.models.enums import EventUserRole, ConnectionStatus
from api.commons.pagination import paginate
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.orm import joinedload
from api.services.user import UserService


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
        """Get list of event users with privacy filtering based on viewer's role"""
        current_user_id = get_jwt_identity()
        
        if not current_user_id:
            from flask_smorest import abort
            abort(401, message="Authentication required")
            
        current_user_id = int(current_user_id)
        
        # Check if current user is admin/organizer for this event
        current_event_user = EventUser.query.filter_by(
            event_id=event_id, 
            user_id=current_user_id
        ).first()
        
        is_event_admin = current_event_user and current_event_user.role in [
            EventUserRole.ADMIN, 
            EventUserRole.ORGANIZER
        ]
        
        # Get base query with eager loading for efficiency
        query = EventUser.query.filter_by(event_id=event_id)
        if role:
            query = query.filter_by(role=role)
        
        # Eager load users to avoid N+1 queries
        query = query.options(joinedload(EventUser.user))
        
        # Get all event users
        event_users = query.all()
        
        # Process each user with appropriate privacy filtering
        result = []
        for event_user in event_users:
            if is_event_admin:
                # Admins get full data with real email for event management
                user_data = {
                    'id': event_user.user.id,
                    'first_name': event_user.user.first_name,
                    'last_name': event_user.user.last_name,
                    'full_name': event_user.user.full_name,
                    'email': event_user.user.email,  # Always real email for admins
                    'company_name': event_user.user.company_name,
                    'title': event_user.user.title,
                    'bio': event_user.user.bio,
                    'image_url': event_user.user.image_url,
                    'social_links': event_user.user.social_links,
                    '_admin_view': True  # Indicator for frontend
                }
            else:
                # Regular users get privacy-filtered data
                user_data = UserService.get_user_for_viewer(
                    event_user.user_id,
                    current_user_id,
                    event_id=event_id,  # Pass event context for overrides
                    require_connection=False  # No connection required in event context
                )
                user_data['_admin_view'] = False
            
            # Build event user response
            event_user_data = {
                'event_id': event_user.event_id,
                'user_id': event_user.user_id,
                'role': event_user.role.value,
                'created_at': event_user.created_at.isoformat() if event_user.created_at else None,
                'is_speaker': event_user.role == EventUserRole.SPEAKER,
                'is_organizer': event_user.role == EventUserRole.ORGANIZER,
                # Include speaker-specific fields if this is a speaker
                'speaker_bio': event_user.speaker_bio if event_user.role == EventUserRole.SPEAKER else None,
                'speaker_title': event_user.speaker_title if event_user.role == EventUserRole.SPEAKER else None,
                # Merge user data (admin or filtered)
                **user_data
            }
            
            # Add connection status for non-self users
            if event_user.user_id != current_user_id:
                connection = EventUserService._get_connection_status(
                    current_user_id, 
                    event_user.user_id
                )
                event_user_data.update(connection)
            
            result.append(event_user_data)
        
        # Apply pagination to the processed results
        return EventUserService._paginate_list(result, "event_users")

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
    
    @staticmethod
    def _get_connection_status(current_user_id, target_user_id):
        """Get connection status between two users"""
        connection = Connection.query.filter(
            (
                (Connection.requester_id == current_user_id) &
                (Connection.recipient_id == target_user_id)
            ) | (
                (Connection.requester_id == target_user_id) &
                (Connection.recipient_id == current_user_id)
            )
        ).first()
        
        if connection:
            return {
                'connection_status': connection.status.value,
                'connection_id': connection.id,
                'connection_direction': 'sent' if connection.requester_id == current_user_id else 'received'
            }
        
        return {
            'connection_status': None,
            'connection_id': None,
            'connection_direction': None
        }
    
    @staticmethod
    def _paginate_list(items, collection_name):
        """Apply pagination to a list of items"""
        from flask import request
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Calculate pagination
        total = len(items)
        start = (page - 1) * per_page
        end = start + per_page
        
        return {
            collection_name: items[start:end],
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page if total > 0 else 0
        }
