# api/services/user.py
from typing import Dict, List, Optional, Tuple, Any, Union

from api.extensions import db
from api.models import User, Event, EventUser, Organization, Session
from api.models.enums import (
    EventUserRole,
    OrganizationUserRole,
    ConnectionStatus,
)
from api.services.privacy import PrivacyService
from api.commons.pagination import paginate
from sqlalchemy import distinct


class UserService:
    @staticmethod
    def get_user(user_id: int):
        """Get a user by ID (WITHOUT privacy filtering - use get_user_for_viewer instead)"""
        user = User.query.get_or_404(user_id)
        return user
    
    @staticmethod
    def get_user_for_viewer(
        user_id: int, 
        viewer_id: Optional[int], 
        event_id: Optional[int] = None,
        require_connection: bool = False
    ) -> Dict[str, Any]:
        """
        Get user data filtered based on viewer's permissions and privacy settings.
        This is the SECURE method that should be used in API endpoints.
        
        Args:
            user_id: ID of the user to retrieve
            viewer_id: ID of the user viewing the data (None for unauthenticated)
            event_id: Optional event context for event-specific privacy rules
            require_connection: If True, requires connection for non-self viewing
            
        Returns:
            Dictionary of filtered user data based on privacy settings
        """
        from api.models import Connection
        from api.models.enums import ConnectionStatus
        from flask_smorest import abort
        
        user = User.query.get_or_404(user_id)
        viewer = User.query.get(viewer_id) if viewer_id else None
        
        # Check if viewing own profile
        if viewer_id and viewer_id == user_id:
            # Return full data for own profile (use proper context from PrivacyService)
            context = PrivacyService.get_viewer_context(user, viewer, event_id)
            return PrivacyService.filter_user_data(user, context, event_id)
        
        # If connection required and not viewing self
        if require_connection:
            if not viewer_id:
                abort(401, message="Authentication required")
                
            # Check for accepted connection
            connection = Connection.query.filter(
                ((Connection.requester_id == viewer_id) & (Connection.recipient_id == user_id)) |
                ((Connection.requester_id == user_id) & (Connection.recipient_id == viewer_id))
            ).filter_by(status=ConnectionStatus.ACCEPTED).first()
            
            if not connection:
                abort(403, message="You must be connected with this user to view their profile")
        
        # Get viewer context
        context = PrivacyService.get_viewer_context(user, viewer, event_id)
        
        # Apply privacy filtering
        filtered_data = PrivacyService.filter_user_data(user, context, event_id)
        
        return filtered_data

    @staticmethod
    def check_user_access(current_user_id: int, target_user_id: int) -> bool:
        """Check if current user has access to view target user's profile"""
        # Can always view own profile
        if current_user_id == target_user_id:
            return True

        current_user = User.query.get_or_404(current_user_id)
        target_user = User.query.get_or_404(target_user_id)

        # Check if they share any events
        shared_events = (
            Event.query.join(EventUser)
            .filter(EventUser.user_id.in_([current_user_id, target_user_id]))
            .group_by(Event.id)
            .having(db.func.count(distinct(EventUser.user_id)) > 1)
            .all()
        )

        # Check if current user is admin in any of target user's orgs
        is_org_admin = any(
            current_user.is_org_admin(org.id)
            for org in target_user.organizations
        )

        return bool(shared_events or is_org_admin)

    @staticmethod
    def update_user(user_id: int, update_data: Dict[str, Any]):
        """Update a user's profile"""
        from sqlalchemy.orm import joinedload
        from api.models.event_user import EventUser
        user = User.query.options(
            joinedload(User.event_users).joinedload(EventUser.event)
        ).get_or_404(user_id)

        for key, value in update_data.items():
            setattr(user, key, value)

        db.session.commit()
        return user

    @staticmethod
    def get_user_events(user_id: int, role: Optional[str] = None, schema=None):
        """Get events a user is participating in (excluding banned), optionally filtered by role"""
        user = User.query.get_or_404(user_id)

        # Base query that excludes banned users
        query = Event.query.join(EventUser).filter(
            EventUser.user_id == user_id,
            EventUser.is_banned.is_(False)  # Exclude banned users
        )

        # Add role filter if specified
        if role:
            try:
                role_enum = EventUserRole(role)
                query = query.filter(EventUser.role == role_enum)
            except ValueError:
                # Invalid role, return empty query
                query = Event.query.filter(False)

        if schema:
            return paginate(query, schema, collection_name="events")

        return query.all()

    @staticmethod
    def get_user_speaking_sessions(user_id: int, schema=None):
        """Get sessions where user is speaking"""
        user = User.query.get_or_404(user_id)

        query = user.get_speaking_sessions()

        if hasattr(query, "__iter__") and not hasattr(query, "all"):
            # If it's already a list, convert to a query for pagination
            session_ids = [session.id for session in query]
            query = Session.query.filter(Session.id.in_(session_ids))

        if schema:
            return paginate(query, schema, collection_name="sessions")

        return query

    @staticmethod
    def check_user_by_email(email: str):
        """Check if a user exists by email"""
        user = User.query.filter_by(email=email).first()
        return user

    @staticmethod
    def create_user(user_data: Dict[str, Any]):
        """Create a new user"""
        # Check if email already exists
        existing_user = User.query.filter_by(email=user_data["email"]).first()
        if existing_user:
            raise ValueError("Email already registered")

        user = User(**user_data)
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def get_user_connections(
        user_id: int, status=ConnectionStatus.ACCEPTED, schema=None
    ):
        """Get a user's connections with specified status"""
        user = User.query.get_or_404(user_id)

        connections = user.get_connections(status)

        if schema and hasattr(schema, "dump"):
            return schema.dump(connections, many=True)

        return connections

    @staticmethod
    def check_connection_status(user_id: int, other_user_id: int):
        """Check connection status between two users"""
        user = User.query.get_or_404(user_id)

        connection = user.get_connection_with(other_user_id)
        return connection.status if connection else None

    @staticmethod
    def is_connected_with(
        user_id: int, other_user_id: int, status=ConnectionStatus.ACCEPTED
    ):
        """Check if user is connected with another user"""
        user = User.query.get_or_404(user_id)

        return user.is_connected_with(other_user_id, status)

    @staticmethod
    def get_connected_users_in_event(user_id: int, event_id: int, schema=None):
        """Get users connected with this user who are also in a specific event"""
        user = User.query.get_or_404(user_id)

        connected_users = user.get_connected_users_in_event(event_id)

        if schema and hasattr(schema, "dump"):
            return schema.dump(connected_users, many=True)

        return connected_users

    @staticmethod
    def get_user_organizations(user_id: int, schema=None):
        """Get organizations a user belongs to"""
        user = User.query.get_or_404(user_id)

        organizations = user.organizations

        if schema and hasattr(schema, "dump"):
            return schema.dump(organizations, many=True)

        return organizations

    @staticmethod
    def get_user_role_in_event(
        user_id: int, event_id: int
    ) -> Optional[EventUserRole]:
        """Get a user's role in an event"""
        user = User.query.get_or_404(user_id)

        return user.get_event_role(event_id)

    @staticmethod
    def get_user_role_in_organization(
        user_id: int, org_id: int
    ) -> Optional[OrganizationUserRole]:
        """Get a user's role in an organization"""
        user = User.query.get_or_404(user_id)

        return user.get_org_role(org_id)

    @staticmethod
    def check_password(user_id: int, password: str) -> bool:
        """Check if a password is valid for a user"""
        user = User.query.get_or_404(user_id)

        return user.verify_password(password)

    @staticmethod
    def change_password(user_id: int, new_password: str):
        """Change a user's password"""
        user = User.query.get_or_404(user_id)

        user.password = new_password
        db.session.commit()
        return True

    @staticmethod
    def deactivate_user(user_id: int):
        """Deactivate a user account"""
        user = User.query.get_or_404(user_id)

        user.is_active = False
        db.session.commit()
        return True

    @staticmethod
    def activate_user(user_id: int):
        """Activate a user account"""
        user = User.query.get_or_404(user_id)

        user.is_active = True
        db.session.commit()
        return True
    
    @staticmethod
    def get_privacy_settings(user_id: int) -> Dict[str, Any]:
        """Get user's privacy settings"""
        user = User.query.get_or_404(user_id)
        
        # Return existing settings or defaults
        if user.privacy_settings:
            return user.privacy_settings
        return PrivacyService.get_default_privacy_settings()
    
    @staticmethod
    def update_privacy_settings(user_id: int, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update user's privacy settings"""
        user = User.query.get_or_404(user_id)
        
        # Merge with existing settings
        current_settings = user.privacy_settings or {}
        updated_settings = {**current_settings, **settings}
        
        user.privacy_settings = updated_settings
        db.session.commit()
        
        return updated_settings
    
    @staticmethod
    def get_event_privacy_overrides(user_id: int, event_id: int) -> Optional[Dict[str, Any]]:
        """Get user's privacy overrides for a specific event"""
        event_user = EventUser.query.filter_by(
            user_id=user_id,
            event_id=event_id
        ).first()
        
        if event_user:
            return event_user.privacy_overrides
        return None
    
    @staticmethod
    def update_event_privacy_overrides(
        user_id: int, 
        event_id: int, 
        overrides: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user's privacy overrides for a specific event"""
        event_user = EventUser.query.filter_by(
            user_id=user_id,
            event_id=event_id
        ).first_or_404()
        
        # Merge with existing overrides
        current_overrides = event_user.privacy_overrides or {}
        updated_overrides = {**current_overrides, **overrides}
        
        event_user.privacy_overrides = updated_overrides
        db.session.commit()
        
        return updated_overrides
