# api/services/organization.py
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any, Union

from api.extensions import db
from api.models import Organization, User, OrganizationUser
from api.models.enums import OrganizationUserRole
from api.commons.pagination import paginate


class OrganizationService:
    @staticmethod
    def get_user_organizations(user_id: int, schema=None):
        """Get all organizations a user belongs to"""
        query = Organization.query.join(
            Organization.organization_users
        ).filter_by(user_id=user_id)

        if schema:
            return paginate(query, schema, collection_name="organizations")

        return query.all()

    @staticmethod
    def get_organization(org_id: int, user_id: Optional[int] = None):
        """Get organization by ID, optionally verifying user membership"""
        org = Organization.query.get_or_404(org_id)

        # If user_id provided, verify membership
        if user_id:
            user = User.query.get_or_404(user_id)
            if not org.user_can_access(user):
                raise ValueError("Not a member of this organization")

        return org

    @staticmethod
    def create_organization(name: str, owner_id: int):
        """Create a new organization with the given user as owner"""
        owner = User.query.get_or_404(owner_id)

        org = Organization(name=name)
        db.session.add(org)
        db.session.flush()  # Get ID without committing

        org.add_user(owner, OrganizationUserRole.OWNER)
        db.session.commit()

        return org

    @staticmethod
    def update_organization(
        org_id: int, user_id: int, update_data: Dict[str, Any]
    ):
        """Update organization details"""
        org = Organization.query.get_or_404(org_id)
        user = User.query.get_or_404(user_id)

        # Verify user is admin or owner
        if not org.is_user_admin_or_owner(user):
            raise ValueError("Must be admin or owner to update organization")

        # Update fields
        for key, value in update_data.items():
            setattr(org, key, value)

        db.session.commit()
        return org

    @staticmethod
    def delete_organization(org_id: int, user_id: int):
        """Delete an organization (owner only)"""
        org = Organization.query.get_or_404(org_id)
        user = User.query.get_or_404(user_id)

        # Verify user is owner
        if org.get_user_role(user) != OrganizationUserRole.OWNER:
            raise ValueError("Must be owner to delete organization")

        db.session.delete(org)
        db.session.commit()
        return True

    @staticmethod
    def add_user_to_organization(
        org_id: int, admin_id: int, user_id: int, role: OrganizationUserRole
    ):
        """Add a user to an organization"""
        org = Organization.query.get_or_404(org_id)
        admin = User.query.get_or_404(admin_id)
        user = User.query.get_or_404(user_id)

        # Verify admin is admin or owner
        if not org.is_user_admin_or_owner(admin):
            raise ValueError("Must be admin or owner to add users")

        # Add user
        try:
            org.add_user(user, role)
            db.session.commit()
            return org
        except ValueError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def remove_user_from_organization(
        org_id: int, admin_id: int, user_id: int
    ):
        """Remove a user from an organization"""
        org = Organization.query.get_or_404(org_id)
        admin = User.query.get_or_404(admin_id)
        user = User.query.get_or_404(user_id)

        # Verify admin is admin or owner
        if not org.is_user_admin_or_owner(admin):
            raise ValueError("Must be admin or owner to remove users")

        # Cannot remove self if owner
        if (
            admin_id == user_id
            and org.get_user_role(admin) == OrganizationUserRole.OWNER
        ):
            raise ValueError("Owner cannot remove themselves")

        # Remove user
        try:
            org.remove_user(user)
            db.session.commit()
            return True
        except ValueError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def update_user_role(
        org_id: int,
        admin_id: int,
        user_id: int,
        new_role: OrganizationUserRole,
    ):
        """Update a user's role in an organization"""
        org = Organization.query.get_or_404(org_id)
        admin = User.query.get_or_404(admin_id)
        user = User.query.get_or_404(user_id)

        # Verify admin is owner
        if org.get_user_role(admin) != OrganizationUserRole.OWNER:
            raise ValueError("Must be owner to change roles")

        # Update role
        try:
            org.update_user_role(user, new_role)
            db.session.commit()
            return org
        except ValueError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def transfer_ownership(
        org_id: int, current_owner_id: int, new_owner_id: int
    ):
        """Transfer organization ownership"""
        org = Organization.query.get_or_404(org_id)
        current_owner = User.query.get_or_404(current_owner_id)
        new_owner = User.query.get_or_404(new_owner_id)

        # Verify current owner is owner
        if org.get_user_role(current_owner) != OrganizationUserRole.OWNER:
            raise ValueError("Must be owner to transfer ownership")

        # Transfer ownership
        try:
            org.transfer_ownership(current_owner, new_owner)
            db.session.commit()
            return org
        except ValueError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_organization_users(
        org_id: int,
        user_id: int,
        role: Optional[OrganizationUserRole] = None,
        schema=None,
    ):
        """Get users in an organization, optionally filtered by role"""
        org = Organization.query.get_or_404(org_id)
        user = User.query.get_or_404(user_id)

        # Verify user is member
        if not org.user_can_access(user):
            raise ValueError("Not a member of this organization")

        # Build query
        query = User.query.join(OrganizationUser).filter(
            OrganizationUser.organization_id == org_id
        )

        # Filter by role if provided
        if role:
            query = query.filter(OrganizationUser.role == role)

        if schema:
            return paginate(query, schema, collection_name="users")

        return query.all()

    @staticmethod
    def get_organization_events(
        org_id: int, user_id: int, upcoming_only: bool = False, schema=None
    ):
        """Get events for an organization"""
        org = Organization.query.get_or_404(org_id)
        user = User.query.get_or_404(user_id)

        # Verify user is member
        if not org.user_can_access(user):
            raise ValueError("Not a member of this organization")

        # Build query with proper filtering
        from api.models import Event
        from api.models.enums import EventStatus
        
        query = Event.query.filter_by(organization_id=org_id)
        
        # Filter out deleted events
        # When comparing SQLAlchemy Enum columns, use the enum directly (not .value)
        query = query.filter(Event.status != EventStatus.DELETED)

        # Filter for upcoming events if requested
        if upcoming_only:
            query = query.filter(Event.start_date > datetime.now())

        if schema:
            return paginate(query, schema, collection_name="events")

        return query.all()

    @staticmethod
    def check_user_is_admin(org_id: int, user_id: int) -> bool:
        """Check if user is admin or owner of organization"""
        org = Organization.query.get_or_404(org_id)
        user = User.query.get_or_404(user_id)

        return org.is_user_admin_or_owner(user)

    @staticmethod
    def check_user_is_owner(org_id: int, user_id: int) -> bool:
        """Check if user is owner of organization"""
        org = Organization.query.get_or_404(org_id)
        user = User.query.get_or_404(user_id)

        return org.get_user_role(user) == OrganizationUserRole.OWNER
