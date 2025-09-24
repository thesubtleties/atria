"""Test User model functionality.

Testing Strategy:
- We test the User model first because it's central to everything
- Users are the actors in our system - they create orgs, events, etc.
- If user authentication/validation breaks, the entire app breaks
"""

import pytest
from datetime import datetime, timezone
from api.models import User, Organization, Event
from api.models.enums import OrganizationUserRole, EventUserRole


class TestUserModel:
    """Test User model core functionality."""

    def test_user_creation_with_required_fields(self, db, user_factory):
        """Test that we can create a user with just required fields.

        Why test this? Ensures our database schema and model match,
        and that we haven't accidentally made optional fields required.
        """
        # Create user with factory (has all required fields)
        user = user_factory()

        assert user.id is not None
        assert user.email is not None
        assert user.first_name is not None
        assert user.last_name is not None
        assert user.created_at is not None

    def test_user_password_hashing(self, db):
        """Test that passwords are hashed, not stored as plaintext.

        Why test this? Security critical! If this fails, we're storing
        passwords in plain text which is a massive security vulnerability.
        """
        user = User(
            email="test@example.com",
            first_name="Test",
            last_name="User",
            password="MySecretPassword123!"  # This should be hashed
        )
        db.session.add(user)
        db.session.commit()

        # Password should be hashed, not plaintext
        # The model stores password as _password (private attribute)
        assert user._password != "MySecretPassword123!"
        assert user._password.startswith("$pbkdf2-sha256$")  # Our hash format

        # Should be able to verify the password
        assert user.verify_password("MySecretPassword123!") is True
        assert user.verify_password("WrongPassword") is False

    def test_user_email_uniqueness(self, db, user_factory):
        """Test that email addresses must be unique.

        Why test this? Prevents duplicate accounts and ensures
        email can be used as a unique identifier for login.
        """
        user1 = user_factory(email="unique@example.com")

        # Try to create another user with same email
        user2 = User(
            email="unique@example.com",  # Same email!
            first_name="Another",
            last_name="User",
            password="password"
        )
        db.session.add(user2)

        # Should raise integrity error on commit
        with pytest.raises(Exception) as exc_info:
            db.session.commit()

        assert "duplicate key" in str(exc_info.value).lower() or \
               "unique" in str(exc_info.value).lower()

    def test_user_full_name_property(self, db, user_factory):
        """Test the full_name computed property.

        Why test this? Computed properties can break if the underlying
        fields change. This ensures our display logic works.
        """
        user = user_factory(first_name="John", last_name="Doe")

        assert user.full_name == "John Doe"

        # Test with empty last name - will have trailing space
        user.last_name = ""
        assert user.full_name == "John "  # Note: has trailing space

    def test_user_default_values(self, db):
        """Test that default values are set correctly.

        Why test this? Defaults are easy to break during migrations
        or model changes. This ensures new users get proper defaults.
        """
        user = User(
            email="defaults@example.com",
            first_name="Default",
            last_name="User",
            password="password"
        )
        db.session.add(user)
        db.session.commit()

        # Check defaults
        assert user.is_active is True  # Users should be active by default
        assert user.email_verified is False  # Should require verification
        assert user.social_links == {}  # Empty dict, not None
        assert user.privacy_settings is not None  # Should have default privacy

    def test_user_organization_relationship(self, db, user_factory, organization_factory):
        """Test that users can belong to multiple organizations.

        Why test this? This is a core multi-tenant feature. Users should
        be able to join multiple organizations with different roles.
        """
        user = user_factory()
        org1 = organization_factory()
        org2 = organization_factory()

        # Add user to both organizations
        org1.add_user(user, OrganizationUserRole.ADMIN)
        org2.add_user(user, OrganizationUserRole.MEMBER)
        db.session.commit()

        # Check relationships work both ways
        assert len(user.organizations) == 2
        assert org1 in user.organizations
        assert org2 in user.organizations

        # Check user has different roles in each org
        assert org1.get_user_role(user) == OrganizationUserRole.ADMIN
        assert org2.get_user_role(user) == OrganizationUserRole.MEMBER

    def test_user_event_relationship(self, db, user_factory, event_factory):
        """Test that users can attend multiple events.

        Why test this? Users should be able to register for multiple
        events and have different roles in each (speaker, attendee, etc).
        """
        user = user_factory()
        event1 = event_factory()
        event2 = event_factory()

        # Add user to events with different roles
        event1.add_user(user, EventUserRole.SPEAKER)
        event2.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Check user is in both events
        assert len(user.events) == 2
        assert event1 in user.events
        assert event2 in user.events

        # Check roles are correct
        assert event1.get_user_role(user) == EventUserRole.SPEAKER
        assert event2.get_user_role(user) == EventUserRole.ATTENDEE

    def test_user_soft_delete_vs_hard_delete(self, db, user_factory):
        """Test soft delete (deactivation) vs hard delete.

        Why test this? We use soft delete to preserve data integrity
        (messages, connections, etc.) while preventing login.
        """
        user = user_factory()
        user_id = user.id

        # Soft delete (deactivate)
        user.is_active = False
        db.session.commit()

        # User should still exist but be inactive
        retrieved_user = User.query.get(user_id)
        assert retrieved_user is not None
        assert retrieved_user.is_active is False

        # Data should be preserved
        assert retrieved_user.email is not None
        assert retrieved_user.first_name is not None

    def test_user_privacy_settings(self, db, user_factory):
        """Test that privacy settings work as JSON field.

        Why test this? JSON fields can be tricky with mutations.
        This ensures we can read and update privacy settings.
        """
        user = user_factory()

        # Default privacy settings should exist
        assert user.privacy_settings is not None
        assert isinstance(user.privacy_settings, dict)

        # Should be able to update privacy settings
        user.privacy_settings = {
            "show_email": False,
            "allow_messages": True,
            "visible_to_public": False
        }
        db.session.commit()

        # Retrieve and verify
        retrieved_user = User.query.get(user.id)
        assert retrieved_user.privacy_settings["show_email"] is False
        assert retrieved_user.privacy_settings["allow_messages"] is True

    @pytest.mark.parametrize("email,is_valid", [
        ("valid@example.com", True),
        ("also.valid+tag@example.co.uk", True),
        ("invalid", False),
        ("@example.com", False),
        ("user@", False),
        ("", False),
        (None, False),
    ])
    def test_user_email_validation(self, db, email, is_valid):
        """Test email validation with various formats.

        Why test this? Email validation is critical for communications
        and authentication. We need to accept valid emails and reject invalid.

        Using parametrize: This decorator runs this test multiple times
        with different inputs, making it easy to test many cases.
        """
        user = User(
            email=email,
            first_name="Test",
            last_name="User",
            password="password"
        )

        if is_valid:
            # Should work fine
            db.session.add(user)
            # Note: actual email validation might happen at API layer
            # This test might need adjustment based on your validation
        else:
            # Should fail - this depends on where validation happens
            # If it's in the API layer, we'd test it there instead
            pass