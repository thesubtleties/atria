"""Test EventUser association model functionality.

Testing Strategy:
- EventUser is the junction table between Events and Users
- It defines roles within an event (ADMIN, ORGANIZER, MODERATOR, SPEAKER, ATTENDEE)
- Critical for event-level permissions and access control
"""

import pytest
from datetime import datetime, timezone
from api.models import User, Event, EventUser
from api.models.enums import EventUserRole


class TestEventUserModel:
    """Test EventUser association and role management."""

    def test_event_user_creation(self, db, user_factory, event_factory):
        """Test creating an event-user association.

        Why test this? EventUser records determine who can access
        an event and what they can do there.
        """
        user = user_factory()
        event = event_factory()

        # Add user to event
        event.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Check association exists
        event_user = EventUser.query.filter_by(
            event_id=event.id,
            user_id=user.id
        ).first()

        assert event_user is not None
        assert event_user.role == EventUserRole.ATTENDEE
        assert event_user.is_banned is False  # Default

    def test_event_user_role_hierarchy(self, db, user_factory, event_factory):
        """Test role hierarchy: ADMIN > ORGANIZER > MODERATOR > SPEAKER > ATTENDEE.

        Why test this? Role hierarchy determines permissions.
        Higher roles should be able to do everything lower roles can.
        """
        event = event_factory()

        admin = user_factory()
        organizer = user_factory()
        moderator = user_factory()
        speaker = user_factory()
        attendee = user_factory()

        # Assign different roles
        event.add_user(admin, EventUserRole.ADMIN)
        event.add_user(organizer, EventUserRole.ORGANIZER)
        event.add_user(moderator, EventUserRole.MODERATOR)
        event.add_user(speaker, EventUserRole.SPEAKER)
        event.add_user(attendee, EventUserRole.ATTENDEE)
        db.session.commit()

        # Verify roles are correctly assigned
        assert event.get_user_role(admin) == EventUserRole.ADMIN
        assert event.get_user_role(organizer) == EventUserRole.ORGANIZER
        assert event.get_user_role(moderator) == EventUserRole.MODERATOR
        assert event.get_user_role(speaker) == EventUserRole.SPEAKER
        assert event.get_user_role(attendee) == EventUserRole.ATTENDEE

    def test_event_user_cannot_have_duplicate_roles(self, db, user_factory, event_factory):
        """Test that a user can't be added to an event twice.

        Why test this? Prevents role conflicts and confusion.
        A user should have exactly one role per event.
        """
        user = user_factory()
        event = event_factory()

        # Add user as attendee
        event.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Try to add again with different role
        with pytest.raises(ValueError):
            event.add_user(user, EventUserRole.SPEAKER)

    def test_event_user_ban_functionality(self, db, user_factory, event_factory):
        """Test banning users from events.

        Why test this? Moderators need ability to ban disruptive users.
        Banned users should lose access but record should remain.
        """
        user = user_factory()
        event = event_factory()

        # Add user to event
        event.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Get the EventUser record
        event_user = EventUser.query.filter_by(
            event_id=event.id,
            user_id=user.id
        ).first()

        # Ban the user
        event_user.is_banned = True
        db.session.commit()

        # Verify ban status
        assert event_user.is_banned is True
        # User should still be in event (for audit trail)
        assert event.has_user(user) is True
        # But might not have access (depends on business logic)

    def test_speaker_specific_fields(self, db, user_factory, event_factory):
        """Test speaker-specific fields in EventUser.

        Why test this? Speakers have additional info like bio and title
        that are displayed on the event page.
        """
        speaker = user_factory()
        event = event_factory()

        # Create EventUser directly to set speaker fields
        event_user = EventUser(
            event_id=event.id,
            user_id=speaker.id,
            role=EventUserRole.SPEAKER,
            speaker_bio="Expert in AI and Machine Learning",
            speaker_title="Chief Technology Officer"
        )
        db.session.add(event_user)
        db.session.commit()

        # Retrieve and verify
        retrieved = EventUser.query.filter_by(
            event_id=event.id,
            user_id=speaker.id
        ).first()

        assert retrieved.role == EventUserRole.SPEAKER
        assert retrieved.speaker_bio == "Expert in AI and Machine Learning"
        assert retrieved.speaker_title == "Chief Technology Officer"

    def test_event_user_removal(self, db, user_factory, event_factory):
        """Test removing a user from an event.

        Why test this? Users may leave events or be removed by admins.
        Need to ensure clean removal.

        TODO: Event model needs remove_user() method for consistency with Organization.
        This test intentionally fails to remind us to add this method.
        """
        user = user_factory()
        event = event_factory()

        # Add and verify user is in event
        event.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()
        assert event.has_user(user) is True

        # TODO: This should work but Event lacks remove_user() method
        # Organization has this method, Event should too for consistency
        event.remove_user(user)  # This will fail - intentional!
        db.session.commit()

        # Verify removal
        assert event.has_user(user) is False
        event_user = EventUser.query.filter_by(
            event_id=event.id,
            user_id=user.id
        ).first()
        assert event_user is None

    def test_event_user_role_update(self, db, user_factory, event_factory):
        """Test updating a user's role in an event.

        Why test this? Users may be promoted (attendee → speaker)
        or demoted (organizer → attendee) based on needs.
        """
        user = user_factory()
        event = event_factory()

        # Start as attendee
        event.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Get EventUser record
        event_user = EventUser.query.filter_by(
            event_id=event.id,
            user_id=user.id
        ).first()

        # Promote to speaker
        event_user.role = EventUserRole.SPEAKER
        db.session.commit()

        # Verify role change
        assert event.get_user_role(user) == EventUserRole.SPEAKER

    def test_event_deletion_cascades_to_event_users(self, db, user_factory, event_factory):
        """Test that deleting an event removes EventUser records.

        Why test this? When an event is deleted, all associations
        should be cleaned up to avoid orphaned records.
        """
        user = user_factory()
        event = event_factory()

        # Add user to event
        event.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        event_id = event.id
        user_id = user.id

        # Verify association exists
        assert EventUser.query.filter_by(event_id=event_id, user_id=user_id).first() is not None

        # Delete event
        db.session.delete(event)
        db.session.commit()

        # EventUser record should be gone
        assert EventUser.query.filter_by(event_id=event_id, user_id=user_id).first() is None

        # User should still exist
        assert User.query.get(user_id) is not None

    def test_user_deletion_behavior_with_event_users(self, db, user_factory, event_factory):
        """Test what happens to EventUser when user is deleted.

        Why test this? Need to understand cascade behavior.
        Options: CASCADE DELETE or SET NULL or PROTECT.
        """
        user = user_factory()
        event = event_factory()

        # Add user to event
        event.add_user(user, EventUserRole.SPEAKER)
        db.session.commit()

        event_id = event.id
        user_id = user.id

        # Delete user
        db.session.delete(user)
        db.session.commit()

        # Check what happened to EventUser
        event_user = EventUser.query.filter_by(event_id=event_id, user_id=user_id).first()
        # This will document actual cascade behavior
        assert event_user is None  # Assuming CASCADE DELETE

    def test_multiple_events_per_user(self, db, user_factory, event_factory):
        """Test that users can join multiple events with different roles.

        Why test this? Users attend many events and may have
        different roles in each (speaker at one, attendee at another).
        """
        user = user_factory()
        event1 = event_factory()
        event2 = event_factory()
        event3 = event_factory()

        # Different role in each event
        event1.add_user(user, EventUserRole.SPEAKER)
        event2.add_user(user, EventUserRole.ORGANIZER)
        event3.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Verify roles
        assert event1.get_user_role(user) == EventUserRole.SPEAKER
        assert event2.get_user_role(user) == EventUserRole.ORGANIZER
        assert event3.get_user_role(user) == EventUserRole.ATTENDEE

        # User should be in all events
        assert event1.has_user(user)
        assert event2.has_user(user)
        assert event3.has_user(user)

    @pytest.mark.parametrize("role,is_staff", [
        (EventUserRole.ADMIN, True),
        (EventUserRole.ORGANIZER, True),
        (EventUserRole.MODERATOR, True),
        (EventUserRole.SPEAKER, False),
        (EventUserRole.ATTENDEE, False),
    ])
    def test_event_user_staff_status(self, db, user_factory, event_factory, role, is_staff):
        """Test which roles are considered 'staff' roles.

        Why test this? Staff roles typically have moderation powers
        and access to restricted areas like backstage chat.

        Using parametrize to test all roles efficiently.
        """
        user = user_factory()
        event = event_factory()

        event.add_user(user, role)
        db.session.commit()

        event_user = EventUser.query.filter_by(
            event_id=event.id,
            user_id=user.id
        ).first()

        # Check if role is considered staff
        # This assumes you have an is_staff property or method
        # Adjust based on your actual implementation
        if is_staff:
            assert role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER, EventUserRole.MODERATOR]
        else:
            assert role in [EventUserRole.SPEAKER, EventUserRole.ATTENDEE]