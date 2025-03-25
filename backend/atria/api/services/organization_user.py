# api/services/organization_user.py
from typing import Dict, List, Optional, Tuple, Any, Union

from api.extensions import db
from api.models import Organization, User, OrganizationUser
from api.models.enums import OrganizationUserRole
from api.commons.pagination import paginate


class OrganizationUserService:
    @staticmethod
    def get_organization_users(
        org_id: int, role: Optional[str] = None, schema=None
    ):
        """Get users in an organization with optional role filter"""
        # Verify organization exists
        org = Organization.query.get_or_404(org_id)

        # Build query
        query = OrganizationUser.query.filter_by(organization_id=org_id)

        # Apply role filter if provided
        if role:
            query = query.filter_by(role=role)

        # Order by created_at
        query = query.order_by(OrganizationUser.created_at)

        if schema:
            return paginate(
                query, schema, collection_name="organization_users"
            )

        return query.all()

    @staticmethod
    def get_organization_user(org_id: int, user_id: int):
        """Get a specific organization user record"""
        org_user = OrganizationUser.query.filter_by(
            organization_id=org_id, user_id=user_id
        ).first_or_404()

        return org_user

    @staticmethod
    def add_user_to_organization(
        org_id: int, user_data: Dict[str, Any], admin_id: int
    ):
        """Add a user to an organization, creating the user if needed"""
        # Verify organization exists
        org = Organization.query.get_or_404(org_id)

        # Verify admin has permission
        admin = User.query.get_or_404(admin_id)
        if not org.is_user_admin_or_owner(admin):
            raise ValueError(
                "Not authorized to add users to this organization"
            )

        # Get or create user
        user = User.query.filter_by(email=user_data["email"]).first()
        if not user:
            # Create new user
            user = User(
                email=user_data["email"],
                password=user_data.get("password", "changeme"),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()  # Get user.id without committing

        # Check if already in org
        if org.has_user(user):
            raise ValueError("User already in organization")

        # Add user to organization with role
        role = user_data.get("role", OrganizationUserRole.MEMBER)
        org.add_user(user, role)
        db.session.commit()

        # Get the new organization user record
        org_user = OrganizationUser.query.filter_by(
            organization_id=org_id, user_id=user.id
        ).first()

        return org_user

    @staticmethod
    def update_user_role(
        org_id: int,
        user_id: int,
        new_role: OrganizationUserRole,
        admin_id: int,
    ):
        """Update a user's role in an organization"""
        # Verify organization exists
        org = Organization.query.get_or_404(org_id)

        # Verify admin has permission
        admin = User.query.get_or_404(admin_id)
        if not org.is_user_admin_or_owner(admin):
            raise ValueError(
                "Not authorized to update roles in this organization"
            )

        # Can't change own role if you're the last owner
        if (
            admin_id == user_id
            and org.get_user_role(admin) == OrganizationUserRole.OWNER
            and org.owner_count == 1
            and new_role != OrganizationUserRole.OWNER
        ):
            raise ValueError("Cannot change role of last owner")

        # Find the organization-user relationship record
        org_user = OrganizationUser.query.filter_by(
            organization_id=org_id, user_id=user_id
        ).first_or_404()

        # Update the role
        try:
            org_user.update_role(new_role)
            db.session.commit()
            return org_user
        except ValueError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def remove_user_from_organization(
        org_id: int, user_id: int, admin_id: int
    ):
        """Remove a user from an organization"""
        # Verify organization exists
        org = Organization.query.get_or_404(org_id)

        # Verify admin has permission
        admin = User.query.get_or_404(admin_id)
        if not org.is_user_admin_or_owner(admin):
            raise ValueError(
                "Not authorized to remove users from this organization"
            )

        # Get target user
        target_user = User.query.get_or_404(user_id)

        # Can't remove self if last owner
        if (
            admin_id == user_id
            and org.get_user_role(admin) == OrganizationUserRole.OWNER
            and org.owner_count == 1
        ):
            raise ValueError("Cannot remove last owner")

        # Remove user
        try:
            org.remove_user(target_user)
            db.session.commit()
            return True
        except ValueError as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_users_by_role(
        org_id: int, role: OrganizationUserRole, schema=None
    ):
        """Get all users with a specific role in an organization"""
        # Verify organization exists
        org = Organization.query.get_or_404(org_id)

        # Get users by role
        query = OrganizationUser.query.filter_by(
            organization_id=org_id, role=role
        )

        if schema:
            return paginate(query, schema, collection_name="users")

        return query.all()

    @staticmethod
    def check_user_role(
        org_id: int, user_id: int
    ) -> Optional[OrganizationUserRole]:
        """Check a user's role in an organization"""
        # Verify organization exists
        org = Organization.query.get_or_404(org_id)

        # Get user
        user = User.query.get_or_404(user_id)

        return org.get_user_role(user)

    @staticmethod
    def is_user_admin_or_owner(org_id: int, user_id: int) -> bool:
        """Check if a user is an admin or owner of an organization"""
        # Verify organization exists
        org = Organization.query.get_or_404(org_id)

        # Get user
        user = User.query.get_or_404(user_id)

        return org.is_user_admin_or_owner(user)

    @staticmethod
    def get_user_organizations(
        user_id: int, role: Optional[OrganizationUserRole] = None, schema=None
    ):
        """Get all organizations a user belongs to, optionally filtered by role"""
        # Verify user exists
        user = User.query.get_or_404(user_id)

        # Build query
        query = Organization.query.join(OrganizationUser).filter(
            OrganizationUser.user_id == user_id
        )

        # Filter by role if provided
        if role:
            query = query.filter(OrganizationUser.role == role)

        if schema:
            return paginate(query, schema, collection_name="organizations")

        return query.all()
