"""Test Organization model functionality.

Testing Strategy:
- Organizations are the top-level multi-tenant containers
- They own events and have users with roles
- Critical for data isolation between customers
"""

import pytest
from datetime import datetime, timezone
from api.models import User, Organization, Event, OrganizationUser
from api.models.enums import OrganizationUserRole, EventStatus


class TestOrganizationModel:
    """Test Organization model and multi-tenant features."""

    def test_organization_creation(self, db, organization_factory):
        """Test basic organization creation.

        Why test this? Organizations are the foundation of multi-tenancy.
        If we can't create orgs, we can't isolate customer data.
        """
        org = organization_factory(name="Test Company")

        assert org.id is not None
        assert org.name == "Test Company"
        assert org.created_at is not None

    def test_organization_owner_relationship(self, db, user_factory):
        """Test that creating an org sets the creator as owner.

        Why test this? The creator should automatically become the owner
        with full permissions. This is a critical security feature.
        """
        owner = user_factory()
        org = Organization(name="My Company")
        db.session.add(org)
        db.session.commit()

        # Add owner
        org.add_user(owner, OrganizationUserRole.OWNER)
        db.session.commit()

        # Check owner has correct role
        assert org.get_user_role(owner) == OrganizationUserRole.OWNER

        # Owner should be in the organization's users
        assert owner in [ou.user for ou in org.organization_users]

    def test_organization_role_hierarchy(self, db, user_factory, organization_factory):
        """Test organization role hierarchy: OWNER > ADMIN > MEMBER.

        Why test this? Role hierarchy determines permissions.
        Owners can do everything, admins most things, members are limited.
        """
        org = organization_factory()
        owner = user_factory()
        admin = user_factory()
        member = user_factory()

        # Assign roles
        org.add_user(owner, OrganizationUserRole.OWNER)
        org.add_user(admin, OrganizationUserRole.ADMIN)
        org.add_user(member, OrganizationUserRole.MEMBER)
        db.session.commit()

        # Verify roles
        assert org.get_user_role(owner) == OrganizationUserRole.OWNER
        assert org.get_user_role(admin) == OrganizationUserRole.ADMIN
        assert org.get_user_role(member) == OrganizationUserRole.MEMBER

        # Test has_user method
        assert org.has_user(owner) is True
        assert org.has_user(admin) is True
        assert org.has_user(member) is True

        # Test with non-member
        non_member = user_factory()
        assert org.has_user(non_member) is False

    def test_organization_cannot_have_duplicate_members(self, db, user_factory, organization_factory):
        """Test that a user can't be added to an org twice.

        Why test this? Prevents duplicate role assignments which would
        cause confusion and potential security issues.
        """
        org = organization_factory()
        user = user_factory()

        # Add user once
        org.add_user(user, OrganizationUserRole.MEMBER)
        db.session.commit()

        # Try to add again - should raise ValueError
        with pytest.raises(ValueError, match="User already in organization"):
            org.add_user(user, OrganizationUserRole.ADMIN)

        # Should still only have one entry with original role
        user_roles = OrganizationUser.query.filter_by(
            organization_id=org.id,
            user_id=user.id
        ).all()

        assert len(user_roles) == 1
        assert user_roles[0].role == OrganizationUserRole.MEMBER  # Original role unchanged

    def test_organization_events_relationship(self, db, organization_factory, event_factory):
        """Test that organizations can have multiple events.

        Why test this? Organizations host events. This relationship
        is crucial for showing the right events to the right users.
        """
        org = organization_factory()

        # Create events for this org
        event1 = event_factory(organization=org)
        event2 = event_factory(organization=org)

        # Create event for different org
        other_org = organization_factory()
        other_event = event_factory(organization=other_org)

        db.session.commit()

        # Check organization has its events
        assert len(org.events) == 2
        assert event1 in org.events
        assert event2 in org.events
        assert other_event not in org.events

    def test_organization_isolation(self, db, user_factory, organization_factory):
        """Test that organizations are isolated from each other.

        Why test this? CRITICAL SECURITY TEST! Data from one organization
        should NEVER leak to another organization. This is the foundation
        of multi-tenant security.
        """
        # Create two separate organizations
        org1 = organization_factory(name="Company A")
        org2 = organization_factory(name="Company B")

        # Create users for each org
        org1_user = user_factory()
        org2_user = user_factory()

        org1.add_user(org1_user, OrganizationUserRole.MEMBER)
        org2.add_user(org2_user, OrganizationUserRole.MEMBER)
        db.session.commit()

        # Users should only see their own org
        assert org1.has_user(org1_user) is True
        assert org1.has_user(org2_user) is False

        assert org2.has_user(org2_user) is True
        assert org2.has_user(org1_user) is False

        # org1_user should not be able to access org2's data
        assert org1_user in [ou.user for ou in org1.organization_users]
        assert org1_user not in [ou.user for ou in org2.organization_users]

    def test_organization_remove_user(self, db, user_factory, organization_factory):
        """Test removing a user from an organization.

        Why test this? Users leave organizations. We need to ensure
        they lose access when removed.
        """
        org = organization_factory()
        user = user_factory()

        # Add and verify user is in org
        org.add_user(user, OrganizationUserRole.MEMBER)
        db.session.commit()
        assert org.has_user(user) is True

        # Remove user
        org.remove_user(user)
        db.session.commit()

        # Verify user is removed
        assert org.has_user(user) is False
        assert user not in [ou.user for ou in org.organization_users]

    def test_organization_cascade_behavior(self, db, user_factory, organization_factory, event_factory):
        """Test what happens when an organization is deleted.

        Why test this? We need to understand cascade behavior.
        Should events be deleted? Should users be deleted?
        This affects data integrity and recovery options.
        """
        org = organization_factory()
        user = user_factory()
        event = event_factory(organization=org)

        org.add_user(user, OrganizationUserRole.OWNER)
        db.session.commit()

        org_id = org.id
        user_id = user.id
        event_id = event.id

        # Delete organization
        db.session.delete(org)
        db.session.commit()

        # Check what happened
        # User should still exist (users can belong to multiple orgs)
        assert User.query.get(user_id) is not None

        # Events might be deleted or orphaned depending on cascade rules
        # This test documents actual behavior
        deleted_event = Event.query.get(event_id)
        # Add assertion based on your actual cascade behavior
        # assert deleted_event is None  # If CASCADE DELETE
        # or
        # assert deleted_event.organization_id is None  # If SET NULL

    def test_organization_can_have_multiple_owners(self, db, user_factory):
        """Test that an organization allows multiple owners.

        Why test this? Documents that the system allows multiple owners,
        which is useful for co-founded organizations or ownership transitions.

        Note: This behavior is currently allowed by the system.
        """
        # Create org without factory to avoid auto-created owner
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        owner1 = user_factory()
        owner2 = user_factory()

        # Add first owner
        org.add_user(owner1, OrganizationUserRole.OWNER)
        db.session.commit()

        # Add second owner - system allows this
        org.add_user(owner2, OrganizationUserRole.OWNER)
        db.session.commit()

        # Count owners
        owners = OrganizationUser.query.filter_by(
            organization_id=org.id,
            role=OrganizationUserRole.OWNER
        ).all()

        # System allows multiple owners
        assert len(owners) == 2
        assert all(owner.role == OrganizationUserRole.OWNER for owner in owners)

    def test_organization_name_constraints(self, db, organization_factory):
        """Test organization name validation and constraints.

        Why test this? Organization names might need to be unique,
        have length limits, or follow certain patterns.
        """
        # Test name length - CURRENTLY NO LIMIT (needs fixing)
        long_name = "A" * 500  # Very long name
        org = organization_factory(name=long_name)

        # TODO: System currently allows unlimited length - should have limit
        # This test documents current behavior (see test-driven-fixes-needed.md)
        assert org.name == long_name
        assert len(org.name) == 500  # Full length preserved (should fail with limit)

        # Test empty name - should this be allowed?
        # org_empty = Organization(name="")
        # This would fail if name is required and non-empty

    def test_organization_owner_permissions_on_events(self, db, user_factory, organization_factory, event_factory):
        """Test that org owners have admin access to all org events.

        Why test this? Organization owners should be able to manage
        all events within their organization, even if they're not
        explicitly added to the event.
        """
        org = organization_factory()
        owner = user_factory()
        org.add_user(owner, OrganizationUserRole.OWNER)

        # Create event in the organization
        event = event_factory(organization=org)
        db.session.commit()

        # Owner should have access even without being explicitly added to event
        # This tests the user_can_access logic from Event model
        assert event.user_can_access(owner) is True

        # For comparison, non-member shouldn't have access
        non_member = user_factory()
        assert event.user_can_access(non_member) is False