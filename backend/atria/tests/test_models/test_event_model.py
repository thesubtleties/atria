"""Tests for the Event model."""

import pytest
from datetime import datetime, timedelta, timezone
from api.models import Event, User, Organization, EventUser
from api.models.enums import EventUserRole, OrganizationUserRole, EventStatus


class TestEventModel:
    """Test Event model functionality."""

    def test_has_user_checks_literal_membership(self, db, user_factory, event_factory):
        """Test that has_user only checks for explicit EventUser records."""
        user = user_factory()
        event = event_factory()

        # User is not in event initially
        assert event.has_user(user) is False

        # Add user to event
        event.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Now user is in event
        assert event.has_user(user) is True

    def test_user_can_access_includes_org_owner(self, db, user_factory, organization_factory, event_factory):
        """Test that user_can_access includes organization owners."""
        org_owner = user_factory()
        regular_user = user_factory()
        org = organization_factory(owner=org_owner)
        event = event_factory(organization=org)

        # Org owner can access without being explicit member
        assert event.has_user(org_owner) is False
        assert event.user_can_access(org_owner) is True

        # Regular user cannot access
        assert event.has_user(regular_user) is False
        assert event.user_can_access(regular_user) is False

        # Add regular user as attendee
        event.add_user(regular_user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Now regular user can access
        assert event.has_user(regular_user) is True
        assert event.user_can_access(regular_user) is True

    def test_get_user_role_returns_admin_for_org_owner(self, db, user_factory, organization_factory, event_factory):
        """Test that org owners get ADMIN role even without explicit membership."""
        org_owner = user_factory()
        org = organization_factory(owner=org_owner)
        event = event_factory(organization=org)

        # Org owner gets admin role without being added
        assert event.get_user_role(org_owner) == EventUserRole.ADMIN

        # Regular user gets None
        regular_user = user_factory()
        assert event.get_user_role(regular_user) is None

    def test_event_creation_adds_creator_as_admin(self, db, user_factory, organization_factory):
        """Test that event creation correctly adds creator as admin."""
        creator = user_factory()
        org = organization_factory()
        org.add_user(creator, OrganizationUserRole.MEMBER)
        db.session.commit()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            event_format="VIRTUAL",
            status="PUBLISHED",
            company_name="Test Company",
            slug=f"test-event-{org.id}",
            start_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=2)).date()
        )
        db.session.add(event)
        db.session.flush()

        # Add creator as admin
        event.add_user(creator, EventUserRole.ADMIN)
        db.session.commit()

        assert event.get_user_role(creator) == EventUserRole.ADMIN
        assert creator in event.users

    def test_soft_delete_preserves_event(self, db, user_factory, event_factory):
        """Test that soft delete preserves event data."""
        user = user_factory()
        event = event_factory()
        original_title = event.title
        event_id = event.id

        # Soft delete the event
        event.soft_delete(user.id)
        db.session.commit()

        # Event still exists
        retrieved_event = Event.query.get(event_id)
        assert retrieved_event is not None
        assert retrieved_event.status == EventStatus.DELETED
        assert retrieved_event.deleted_at is not None
        assert retrieved_event.deleted_by_id == user.id

        # Title should be kept for connection context
        assert retrieved_event.title == original_title

    @pytest.mark.parametrize("start_offset,end_offset,should_fail", [
        (1, 2, False),  # Valid: end after start
        (1, 1, False),  # Valid: same day event
        (2, 1, True),   # Invalid: end before start
        (1, -1, True),  # Invalid: end in past
    ])
    def test_date_validation(self, db, organization_factory, start_offset, end_offset, should_fail):
        """Test event date validation."""
        org = organization_factory()
        now = datetime.now(timezone.utc)

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            event_format="VIRTUAL",
            status="DRAFT",
            company_name="Test Company",
            slug=f"test-event-{start_offset}-{end_offset}",
            start_date=(now + timedelta(days=start_offset)).date(),
            end_date=(now + timedelta(days=end_offset)).date()
        )

        if should_fail:
            with pytest.raises(ValueError):
                event.validate_dates(event.start_date, event.end_date)
        else:
            # Should not raise
            event.validate_dates(event.start_date, event.end_date)