# api/services/user.py
from typing import Dict, List, Optional, Tuple, Any, Union

from api.extensions import db
from api.models import User, Event, EventUser, Organization, Session
from api.models.enums import (
    EventUserRole,
    OrganizationUserRole,
    ConnectionStatus,
)
from api.commons.pagination import paginate
from sqlalchemy import distinct


class UserService:
    @staticmethod
    def get_user(user_id: int):
        """Get a user by ID"""
        user = User.query.get_or_404(user_id)
        return user

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
        user = User.query.get_or_404(user_id)

        for key, value in update_data.items():
            setattr(user, key, value)

        db.session.commit()
        return user

    @staticmethod
    def get_user_events(user_id: int, role: Optional[str] = None, schema=None):
        """Get events a user is participating in, optionally filtered by role"""
        user = User.query.get_or_404(user_id)

        if role:
            # Convert string role to enum
            try:
                role_enum = EventUserRole(role)
                query = user.get_events_by_role(role_enum)
            except ValueError:
                # Invalid role, return empty query
                query = Event.query.filter(False)
        else:
            query = Event.query.join(EventUser).filter(
                EventUser.user_id == user_id
            )

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
