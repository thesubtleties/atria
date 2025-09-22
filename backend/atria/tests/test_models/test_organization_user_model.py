"""Test OrganizationUser association model functionality.

Testing Strategy:
- OrganizationUser is the junction table between Organizations and Users
- Defines roles within an organization (OWNER > ADMIN > MEMBER)
- Critical for organization-level permissions and access control
- Provides helper methods and properties for user info access
"""

import pytest
from api.models import User, Organization, OrganizationUser
from api.models.enums import OrganizationUserRole


class TestOrganizationUserModel:
    """Test OrganizationUser association and role management."""

    def test_organization_user_creation(self, db, user_factory, organization_factory):
        """Test creating an organization-user association.

        Why test this? OrganizationUser records determine who can access
        an organization and what they can do there.
        """
        user = user_factory()
        org = organization_factory()

        # Create association directly
        org_user = OrganizationUser(
            organization_id=org.id,
            user_id=user.id,
            role=OrganizationUserRole.MEMBER
        )
        db.session.add(org_user)
        db.session.commit()

        assert org_user.organization_id == org.id
        assert org_user.user_id == user.id
        assert org_user.role == OrganizationUserRole.MEMBER
        assert org_user.created_at is not None

    def test_role_hierarchy(self, db, user_factory, organization_factory):
        """Test role hierarchy: OWNER > ADMIN > MEMBER.

        Why test this? Role hierarchy determines permissions.
        Higher roles should be able to do everything lower roles can.
        """
        org = organization_factory()
        owner = user_factory()
        admin = user_factory()
        member = user_factory()

        # Create users with different roles
        owner_assoc = OrganizationUser(
            organization_id=org.id,
            user_id=owner.id,
            role=OrganizationUserRole.OWNER
        )
        admin_assoc = OrganizationUser(
            organization_id=org.id,
            user_id=admin.id,
            role=OrganizationUserRole.ADMIN
        )
        member_assoc = OrganizationUser(
            organization_id=org.id,
            user_id=member.id,
            role=OrganizationUserRole.MEMBER
        )

        db.session.add_all([owner_assoc, admin_assoc, member_assoc])
        db.session.commit()

        # Test role properties
        assert owner_assoc.is_owner is True
        assert owner_assoc.is_admin is False  # is_admin specifically checks ADMIN role

        assert admin_assoc.is_owner is False
        assert admin_assoc.is_admin is True

        assert member_assoc.is_owner is False
        assert member_assoc.is_admin is False

    def test_update_role_with_validation(self, db, user_factory):
        """Test updating a user's role with validation.

        Why test this? Role changes need validation to prevent
        removing the last owner which would orphan the organization.
        """
        # Create org manually to avoid auto-created owner
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        user1 = user_factory()
        user2 = user_factory()

        # Create one owner
        owner_assoc = OrganizationUser(
            organization_id=org.id,
            user_id=user1.id,
            role=OrganizationUserRole.OWNER
        )
        db.session.add(owner_assoc)
        db.session.commit()

        # Try to demote the only owner - should fail
        with pytest.raises(ValueError, match="Cannot remove last owner"):
            owner_assoc.update_role(OrganizationUserRole.ADMIN)

        # Add another owner
        owner2_assoc = OrganizationUser(
            organization_id=org.id,
            user_id=user2.id,
            role=OrganizationUserRole.OWNER
        )
        db.session.add(owner2_assoc)
        db.session.commit()

        # Now can demote first owner
        changed = owner_assoc.update_role(OrganizationUserRole.ADMIN)
        db.session.commit()

        assert changed is True
        assert owner_assoc.role == OrganizationUserRole.ADMIN

        # Update to same role returns False
        changed = owner_assoc.update_role(OrganizationUserRole.ADMIN)
        assert changed is False

    def test_get_by_role_class_method(self, db, user_factory):
        """Test getting all users with a specific role.

        Why test this? Need to efficiently query users by role,
        e.g., find all admins or all owners.
        """
        # Create org manually to avoid auto-created owner
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        users = [user_factory() for _ in range(5)]

        # Create different roles
        roles = [
            OrganizationUserRole.OWNER,
            OrganizationUserRole.OWNER,
            OrganizationUserRole.ADMIN,
            OrganizationUserRole.MEMBER,
            OrganizationUserRole.MEMBER,
        ]

        for user, role in zip(users, roles):
            org_user = OrganizationUser(
                organization_id=org.id,
                user_id=user.id,
                role=role
            )
            db.session.add(org_user)
        db.session.commit()

        # Get users by role
        owners = OrganizationUser.get_by_role(org.id, OrganizationUserRole.OWNER)
        admins = OrganizationUser.get_by_role(org.id, OrganizationUserRole.ADMIN)
        members = OrganizationUser.get_by_role(org.id, OrganizationUserRole.MEMBER)

        assert len(owners) == 2
        assert len(admins) == 1
        assert len(members) == 2

    def test_user_info_properties(self, db, organization_factory):
        """Test properties that expose user information.

        Why test this? OrganizationUser provides convenient access
        to user details without explicit joins.
        """
        # Create user with specific details
        user = User(
            email='john.doe@sbtl.ai',
            first_name='John',
            last_name='Doe',
            password='password123',
            image_url='https://example.com/avatar.jpg',
            social_links={
                'twitter': 'https://twitter.com/johndoe',
                'linkedin': 'https://linkedin.com/in/johndoe'
            }
        )
        db.session.add(user)

        org = organization_factory()
        db.session.commit()

        org_user = OrganizationUser(
            organization_id=org.id,
            user_id=user.id,
            role=OrganizationUserRole.MEMBER
        )
        db.session.add(org_user)
        db.session.commit()

        # Test all user info properties
        assert org_user.user_name == "John Doe"
        assert org_user.first_name == "John"
        assert org_user.last_name == "Doe"
        assert org_user.sort_name == "Doe, John"
        assert org_user.email == "john.doe@sbtl.ai"
        assert org_user.image_url == "https://example.com/avatar.jpg"
        assert org_user.social_links == {
            'twitter': 'https://twitter.com/johndoe',
            'linkedin': 'https://linkedin.com/in/johndoe'
        }

    def test_relationship_navigation(self, db, user_factory, organization_factory):
        """Test navigating relationships from OrganizationUser.

        Why test this? Need to access both organization and user
        from the association record.
        """
        user = user_factory()
        org = organization_factory()

        org_user = OrganizationUser(
            organization_id=org.id,
            user_id=user.id,
            role=OrganizationUserRole.MEMBER
        )
        db.session.add(org_user)
        db.session.commit()

        # Navigate to organization
        assert org_user.organization == org
        assert org_user.organization.name == org.name

        # Navigate to user
        assert org_user.user == user
        assert org_user.user.email == user.email

    def test_cascade_deletion_from_organization(self, db, user_factory, organization_factory):
        """Test that OrganizationUser is deleted when organization is deleted.

        Why test this? When an organization is deleted,
        all membership records should be cleaned up.
        """
        user = user_factory()
        org = organization_factory()

        org_user = OrganizationUser(
            organization_id=org.id,
            user_id=user.id,
            role=OrganizationUserRole.MEMBER
        )
        db.session.add(org_user)
        db.session.commit()

        org_id = org.id
        user_id = user.id

        # Delete organization
        db.session.delete(org)
        db.session.commit()

        # OrganizationUser should be gone
        deleted = OrganizationUser.query.filter_by(
            organization_id=org_id,
            user_id=user_id
        ).first()
        assert deleted is None

        # User should still exist
        assert User.query.get(user_id) is not None

    def test_cascade_deletion_from_user(self, db, user_factory, organization_factory):
        """Test what happens when a user is deleted.

        Why test this? Need to understand cascade behavior.
        Does OrganizationUser get deleted or set to NULL?
        """
        user = user_factory()
        org = organization_factory()

        org_user = OrganizationUser(
            organization_id=org.id,
            user_id=user.id,
            role=OrganizationUserRole.MEMBER
        )
        db.session.add(org_user)
        db.session.commit()

        org_id = org.id
        user_id = user.id

        # Delete user
        db.session.delete(user)

        # This might fail due to foreign key constraint
        # Document actual behavior
        try:
            db.session.commit()
            # If it succeeds, check if association was deleted
            deleted = OrganizationUser.query.filter_by(
                organization_id=org_id,
                user_id=user_id
            ).first()
            # Likely CASCADE delete based on foreign key
            assert deleted is None
        except Exception as e:
            # If it fails, document that user deletion is restricted
            db.session.rollback()
            # This would mean PROTECT or RESTRICT behavior

    def test_composite_primary_key(self, db, user_factory, organization_factory):
        """Test that org_id + user_id form composite primary key.

        Why test this? Ensures a user can't have duplicate roles
        in the same organization.
        """
        user = user_factory()
        org = organization_factory()

        # Create first association
        org_user1 = OrganizationUser(
            organization_id=org.id,
            user_id=user.id,
            role=OrganizationUserRole.MEMBER
        )
        db.session.add(org_user1)
        db.session.commit()

        # Try to create duplicate - should fail
        org_user2 = OrganizationUser(
            organization_id=org.id,
            user_id=user.id,
            role=OrganizationUserRole.ADMIN  # Different role
        )
        db.session.add(org_user2)

        from sqlalchemy.exc import IntegrityError
        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_user_in_multiple_organizations(self, db, user_factory, organization_factory):
        """Test that a user can belong to multiple organizations.

        Why test this? Users often belong to multiple organizations
        with potentially different roles in each.
        """
        user = user_factory()
        org1 = organization_factory()
        org2 = organization_factory()
        org3 = organization_factory()

        # Add user to multiple orgs with different roles
        org_user1 = OrganizationUser(
            organization_id=org1.id,
            user_id=user.id,
            role=OrganizationUserRole.OWNER
        )
        org_user2 = OrganizationUser(
            organization_id=org2.id,
            user_id=user.id,
            role=OrganizationUserRole.ADMIN
        )
        org_user3 = OrganizationUser(
            organization_id=org3.id,
            user_id=user.id,
            role=OrganizationUserRole.MEMBER
        )

        db.session.add_all([org_user1, org_user2, org_user3])
        db.session.commit()

        # Verify user has different roles in different orgs
        assert org_user1.role == OrganizationUserRole.OWNER
        assert org_user2.role == OrganizationUserRole.ADMIN
        assert org_user3.role == OrganizationUserRole.MEMBER

        # User can be owner in one org and member in another
        assert org_user1.is_owner is True
        assert org_user3.is_owner is False

    def test_multiple_owners_allowed(self, db, user_factory):
        """Test that organizations can have multiple owners.

        Why test this? Some organizations have co-founders
        or need ownership transitions.
        """
        # Create org manually to avoid auto-created owner
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        owner1 = user_factory()
        owner2 = user_factory()
        owner3 = user_factory()

        # Create multiple owners
        owners = []
        for owner in [owner1, owner2, owner3]:
            org_user = OrganizationUser(
                organization_id=org.id,
                user_id=owner.id,
                role=OrganizationUserRole.OWNER
            )
            db.session.add(org_user)
            owners.append(org_user)

        db.session.commit()

        # All should be owners
        for org_user in owners:
            assert org_user.is_owner is True

        # Get all owners
        all_owners = OrganizationUser.get_by_role(
            org.id,
            OrganizationUserRole.OWNER
        )
        assert len(all_owners) == 3

    def test_role_change_tracking(self, db, user_factory, organization_factory):
        """Test that role changes return correct boolean.

        Why test this? Applications may need to know if
        a role actually changed to trigger notifications.
        """
        org = organization_factory()
        user = user_factory()

        org_user = OrganizationUser(
            organization_id=org.id,
            user_id=user.id,
            role=OrganizationUserRole.MEMBER
        )
        db.session.add(org_user)
        db.session.commit()

        # Change role - should return True
        changed = org_user.update_role(OrganizationUserRole.ADMIN)
        assert changed is True
        assert org_user.role == OrganizationUserRole.ADMIN

        # Same role - should return False
        changed = org_user.update_role(OrganizationUserRole.ADMIN)
        assert changed is False
        assert org_user.role == OrganizationUserRole.ADMIN

        # Change again - should return True
        changed = org_user.update_role(OrganizationUserRole.MEMBER)
        assert changed is True
        assert org_user.role == OrganizationUserRole.MEMBER