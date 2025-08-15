from api.extensions import db
from api.models import Event, User, EventUser, Session, SessionSpeaker, Connection, Organization
from api.models.enums import EventUserRole, ConnectionStatus, OrganizationUserRole
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

        # Eager load users and order by last name, then first name (consistent with regular endpoint)
        query = query.options(joinedload(EventUser.user)).join(EventUser.user).order_by(User.last_name, User.first_name)

        # Get the paginated response
        result = paginate(query, schema, collection_name="event_users")
        
        # Add role counts to help with UI display and permission checks
        result["role_counts"] = {
            "total": EventUser.query.filter_by(event_id=event_id).count(),
            "admins": EventUser.query.filter_by(
                event_id=event_id, role=EventUserRole.ADMIN
            ).count(),
            "organizers": EventUser.query.filter_by(
                event_id=event_id, role=EventUserRole.ORGANIZER
            ).count(),
            "speakers": EventUser.query.filter_by(
                event_id=event_id, role=EventUserRole.SPEAKER
            ).count(),
            "attendees": EventUser.query.filter_by(
                event_id=event_id, role=EventUserRole.ATTENDEE
            ).count(),
        }
        
        return result
    
    @staticmethod
    def get_event_users_with_connection_status(event_id, role=None, schema=None):
        """Get list of event users with privacy filtering based on viewer's role - excludes banned users for networking"""
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
        
        # Filter out banned users for networking purposes
        query = query.filter(EventUser.is_banned.is_(False))
        
        # Eager load users to avoid N+1 queries and order by last name
        query = query.options(joinedload(EventUser.user)).join(EventUser.user).order_by(User.last_name, User.first_name)
        
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
    def update_user_role(event_id, user_id, update_data, current_user_id=None):
        """Update user's role or info in event"""
        from flask_jwt_extended import get_jwt_identity
        from flask_smorest import abort
        
        # Get current user if not provided
        if current_user_id is None:
            current_user_id = int(get_jwt_identity())
        
        # Get event user being updated
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first_or_404()
        
        # Check if role is being changed
        if "role" in update_data:
            new_role = update_data["role"]
            current_role = event_user.role
            
            # Rule 1: Users cannot change their own role
            if current_user_id == user_id:
                abort(403, message="You cannot change your own role")
            
            # Get current user's role in the event
            current_user_event = EventUser.query.filter_by(
                event_id=event_id, user_id=current_user_id
            ).first()
            
            # Check if user is org owner
            event = Event.query.get(event_id)
            org = Organization.query.get(event.organization_id)
            current_user_obj = User.query.get(current_user_id)
            is_org_owner = org.get_user_role(current_user_obj) == OrganizationUserRole.OWNER
            
            if not current_user_event and not is_org_owner:
                abort(403, message="You are not a member of this event")
            
            # Org owners have admin-like permissions
            if is_org_owner:
                current_user_role = EventUserRole.ADMIN
            else:
                current_user_role = current_user_event.role
            
            # Rule 2: Organizers have limited permissions
            if current_user_role == EventUserRole.ORGANIZER:
                allowed_roles = [EventUserRole.ATTENDEE, EventUserRole.SPEAKER]
                
                # Check if target's current role can be changed by organizer
                if current_role not in allowed_roles:
                    abort(403, message="Organizers cannot change roles of other organizers or admins")
                
                # Check if new role is allowed for organizers to set
                if new_role not in allowed_roles:
                    abort(403, message="Organizers can only assign attendee or speaker roles")
            
            # Rule 3: Protect last admin
            if current_role == EventUserRole.ADMIN and new_role != EventUserRole.ADMIN:
                admin_count = EventUser.query.filter_by(
                    event_id=event_id, role=EventUserRole.ADMIN
                ).count()
                
                if admin_count <= 1:
                    abort(400, message="Cannot remove or change role of last admin")
            
            # Apply the role change
            event_user.role = new_role
            
            # If downgrading from SPEAKER to ATTENDEE, remove from all sessions
            if current_role == EventUserRole.SPEAKER and new_role == EventUserRole.ATTENDEE:
                # Remove from all sessions in this event
                session_ids = Session.query.filter_by(event_id=event_id).with_entities(
                    Session.id
                )
                removed_count = SessionSpeaker.query.filter(
                    SessionSpeaker.session_id.in_(session_ids),
                    SessionSpeaker.user_id == user_id,
                ).delete(synchronize_session=False)
                
                if removed_count > 0:
                    # Note: Frontend will show the warning, backend just logs it
                    print(f"Removed user {user_id} from {removed_count} session(s) after downgrading to ATTENDEE")

        # Update speaker info if applicable
        if event_user.role == EventUserRole.SPEAKER:
            if "speaker_bio" in update_data:
                event_user.speaker_bio = update_data["speaker_bio"]
            if "speaker_title" in update_data:
                event_user.speaker_title = update_data["speaker_title"]

        db.session.commit()
        return event_user

    @staticmethod
    def remove_user_from_event(event_id, user_id, current_user_id=None):
        """Remove user from event"""
        from flask_jwt_extended import get_jwt_identity
        from flask_smorest import abort
        
        # Get current user if not provided
        if current_user_id is None:
            current_user_id = int(get_jwt_identity())
        
        # Prevent users from removing themselves
        if current_user_id == user_id:
            abort(403, message="You cannot remove yourself from the event")
        
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
            abort(400, message="Cannot remove last admin")

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
        """Apply pagination to a list of items - matching standard format"""
        from flask import request
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Calculate pagination
        total = len(items)
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        start = (page - 1) * per_page
        end = start + per_page
        
        return {
            collection_name: items[start:end],
            'total_items': total,  # Changed from 'total'
            'total_pages': total_pages,  # Changed from 'pages'
            'current_page': page,  # Changed from 'page'
            'per_page': per_page,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
