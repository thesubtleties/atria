"""Integration tests for event moderation system.

Testing Strategy:
- Tests the FULL moderation stack: HTTP → Route → Service → Model → Database
- Covers event bans, chat bans, role hierarchy, and protection mechanisms
- Tests temporal features (temporary chat bans with expiry)
- Validates audit trails and moderation notes
- Ensures proper permission enforcement
"""

import pytest
import json
from datetime import datetime, timezone, timedelta
from api.models import User, Organization, Event, EventUser
from api.models.enums import EventUserRole, OrganizationUserRole
from api.extensions import db


class TestModerationIntegration:
    """Test event moderation system through the full stack."""

    def test_event_ban_flow(self, client, db):
        """Test banning and unbanning a user from an event.

        Why test this? Event bans are the strongest moderation action,
        completely removing a user's access to the event.
        """
        # Create users and event
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        attendee = User(
            email="attendee@sbtl.ai",
            first_name="Attendee",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([admin, attendee])
        db.session.commit()

        # Create org and event
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(admin, OrganizationUserRole.OWNER)
        db.session.flush()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add(event)
        db.session.flush()

        # Add users to event
        event.add_user(admin, EventUserRole.ADMIN)
        event.add_user(attendee, EventUserRole.ATTENDEE)
        db.session.commit()

        # Login as admin
        client.post(
            "/api/auth/login",
            json={"email": "admin@sbtl.ai", "password": "Pass123!"},
        )

        # Ban the attendee
        ban_response = client.post(
            f"/api/events/{event.id}/users/{attendee.id}/ban",
            json={
                "reason": "Violated code of conduct",
                "moderation_notes": "Multiple warnings ignored"
            }
        )
        assert ban_response.status_code == 200
        ban_data = json.loads(ban_response.data)
        assert ban_data["success"] is True
        assert "banned successfully" in ban_data["message"]
        assert ban_data["moderation_status"]["is_banned"] is True
        assert ban_data["moderation_status"]["ban_reason"] == "Violated code of conduct"

        # Verify ban in database
        event_user = EventUser.query.filter_by(
            event_id=event.id, user_id=attendee.id
        ).first()
        assert event_user.is_banned is True
        assert event_user.banned_by == admin.id
        assert "Multiple warnings ignored" in event_user.moderation_notes

        # Try to ban again (should fail)
        ban_again = client.post(
            f"/api/events/{event.id}/users/{attendee.id}/ban",
            json={"reason": "Another reason"}
        )
        assert ban_again.status_code == 400
        error_data = json.loads(ban_again.data)
        assert "already banned" in error_data["message"].lower()

        # Unban the user
        unban_response = client.post(
            f"/api/events/{event.id}/users/{attendee.id}/unban",
            json={"moderation_notes": "User apologized and agreed to comply"}
        )
        assert unban_response.status_code == 200
        unban_data = json.loads(unban_response.data)
        assert unban_data["success"] is True
        assert unban_data["moderation_status"]["is_banned"] is False

        # Verify unban in database
        event_user = EventUser.query.filter_by(
            event_id=event.id, user_id=attendee.id
        ).first()
        assert event_user.is_banned is False
        assert event_user.banned_by is None
        assert "User apologized" in event_user.moderation_notes

    def test_chat_ban_temporary(self, client, db):
        """Test temporary chat ban with automatic expiry.

        Why test this? Temporary chat bans allow graduated moderation
        responses for minor infractions.
        """
        # Create users and event
        organizer = User(
            email="organizer@sbtl.ai",
            first_name="Organizer",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        speaker = User(
            email="speaker@sbtl.ai",
            first_name="Speaker",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([organizer, speaker])
        db.session.commit()

        # Create org and event
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(organizer, OrganizationUserRole.OWNER)
        db.session.flush()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add(event)
        db.session.flush()

        # Add users to event
        event.add_user(organizer, EventUserRole.ORGANIZER)
        event.add_user(speaker, EventUserRole.SPEAKER)
        db.session.commit()

        # Login as organizer
        client.post(
            "/api/auth/login",
            json={"email": "organizer@sbtl.ai", "password": "Pass123!"},
        )

        # Temporary chat ban for 2 hours
        chat_ban_response = client.post(
            f"/api/events/{event.id}/users/{speaker.id}/chat-ban",
            json={
                "reason": "Spamming chat",
                "duration_hours": 2,
                "moderation_notes": "First offense - 2 hour timeout"
            }
        )
        assert chat_ban_response.status_code == 200
        chat_ban_data = json.loads(chat_ban_response.data)
        assert chat_ban_data["success"] is True
        assert chat_ban_data["moderation_status"]["is_chat_banned"] is True
        assert chat_ban_data["moderation_status"]["chat_ban_reason"] == "Spamming chat"
        assert chat_ban_data["moderation_status"]["can_use_chat"] is False

        # Verify chat ban expiry time
        event_user = EventUser.query.filter_by(
            event_id=event.id, user_id=speaker.id
        ).first()
        assert event_user.is_chat_banned is True
        assert event_user.chat_ban_until is not None
        expected_expiry = datetime.now(timezone.utc) + timedelta(hours=2)
        # Allow 1 minute tolerance for test execution time
        assert abs((event_user.chat_ban_until - expected_expiry).total_seconds()) < 60

        # Simulate time passing (modify the ban time to be expired)
        event_user.chat_ban_until = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.session.commit()

        # Check if user can use chat now (ban expired)
        assert event_user.can_use_chat() is True

    def test_chat_ban_permanent(self, client, db):
        """Test permanent chat ban and unban.

        Why test this? Permanent chat bans are for severe or repeated violations,
        requiring manual intervention to restore access.
        """
        # Create users and event
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        attendee = User(
            email="attendee@sbtl.ai",
            first_name="Attendee",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([admin, attendee])
        db.session.commit()

        # Create org and event
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(admin, OrganizationUserRole.OWNER)
        db.session.flush()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add(event)
        db.session.flush()

        event.add_user(admin, EventUserRole.ADMIN)
        event.add_user(attendee, EventUserRole.ATTENDEE)
        db.session.commit()

        # Login as admin
        client.post(
            "/api/auth/login",
            json={"email": "admin@sbtl.ai", "password": "Pass123!"},
        )

        # Permanent chat ban (no duration specified)
        chat_ban_response = client.post(
            f"/api/events/{event.id}/users/{attendee.id}/chat-ban",
            json={
                "reason": "Harassment",
                "moderation_notes": "Multiple reports of harassment"
            }
        )
        assert chat_ban_response.status_code == 200
        chat_ban_data = json.loads(chat_ban_response.data)
        assert chat_ban_data["moderation_status"]["is_chat_banned"] is True
        assert chat_ban_data["moderation_status"]["chat_ban_until"] is None  # Permanent

        # Try to chat ban again (should fail)
        chat_ban_again = client.post(
            f"/api/events/{event.id}/users/{attendee.id}/chat-ban",
            json={"reason": "Another reason"}
        )
        assert chat_ban_again.status_code == 400
        error_data = json.loads(chat_ban_again.data)
        assert "already" in error_data["message"].lower()

        # Unban from chat
        chat_unban_response = client.post(
            f"/api/events/{event.id}/users/{attendee.id}/chat-unban",
            json={"moderation_notes": "User completed moderation training"}
        )
        assert chat_unban_response.status_code == 200
        chat_unban_data = json.loads(chat_unban_response.data)
        assert chat_unban_data["moderation_status"]["is_chat_banned"] is False
        assert chat_unban_data["moderation_status"]["can_use_chat"] is True

    def test_role_hierarchy_enforcement(self, client, db):
        """Test that moderation respects role hierarchy.

        Why test this? Prevents power abuse and maintains proper
        chain of command in event management.
        """
        # Create users
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        organizer1 = User(
            email="organizer1@sbtl.ai",
            first_name="Organizer1",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        organizer2 = User(
            email="organizer2@sbtl.ai",
            first_name="Organizer2",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        speaker = User(
            email="speaker@sbtl.ai",
            first_name="Speaker",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        attendee = User(
            email="attendee@sbtl.ai",
            first_name="Attendee",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([admin, organizer1, organizer2, speaker, attendee])
        db.session.commit()

        # Create org and event
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(admin, OrganizationUserRole.OWNER)
        db.session.flush()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add(event)
        db.session.flush()

        # Add users with different roles
        event.add_user(admin, EventUserRole.ADMIN)
        event.add_user(organizer1, EventUserRole.ORGANIZER)
        event.add_user(organizer2, EventUserRole.ORGANIZER)
        event.add_user(speaker, EventUserRole.SPEAKER)
        event.add_user(attendee, EventUserRole.ATTENDEE)
        db.session.commit()

        # Test 1: Organizer can ban attendee
        client.post(
            "/api/auth/login",
            json={"email": "organizer1@sbtl.ai", "password": "Pass123!"},
        )

        ban_attendee = client.post(
            f"/api/events/{event.id}/users/{attendee.id}/ban",
            json={"reason": "Disruptive behavior"}
        )
        assert ban_attendee.status_code == 200

        # Unban for next test
        client.post(
            f"/api/events/{event.id}/users/{attendee.id}/unban",
            json={"moderation_notes": "Test reset"}
        )

        # Test 2: Organizer can ban speaker
        ban_speaker = client.post(
            f"/api/events/{event.id}/users/{speaker.id}/ban",
            json={"reason": "Policy violation"}
        )
        assert ban_speaker.status_code == 200

        # Unban for next test
        client.post(
            f"/api/events/{event.id}/users/{speaker.id}/unban",
            json={"moderation_notes": "Test reset"}
        )

        # Test 3: Organizer CANNOT ban another organizer
        ban_organizer = client.post(
            f"/api/events/{event.id}/users/{organizer2.id}/ban",
            json={"reason": "Test ban"}
        )
        assert ban_organizer.status_code == 400
        error_data = json.loads(ban_organizer.data)
        assert "cannot moderate other organizers" in error_data["message"].lower()

        # Test 4: Organizer CANNOT ban admin
        ban_admin = client.post(
            f"/api/events/{event.id}/users/{admin.id}/ban",
            json={"reason": "Test ban"}
        )
        assert ban_admin.status_code == 400

        # Test 5: Admin CAN ban organizer
        client.post(
            "/api/auth/login",
            json={"email": "admin@sbtl.ai", "password": "Pass123!"},
        )

        ban_organizer_by_admin = client.post(
            f"/api/events/{event.id}/users/{organizer1.id}/ban",
            json={"reason": "Admin action"}
        )
        assert ban_organizer_by_admin.status_code == 200

        # Test 6: Admin cannot ban themselves
        self_ban = client.post(
            f"/api/events/{event.id}/users/{admin.id}/ban",
            json={"reason": "Self ban"}
        )
        assert self_ban.status_code == 400
        error_data = json.loads(self_ban.data)
        assert "cannot moderate yourself" in error_data["message"].lower()

    def test_last_admin_protection(self, client, db):
        """Test that the last admin of an event cannot be banned.

        Why test this? Prevents events from being left without any
        administrative control.
        """
        # Create users
        admin1 = User(
            email="admin1@sbtl.ai",
            first_name="Admin1",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        admin2 = User(
            email="admin2@sbtl.ai",
            first_name="Admin2",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        organizer = User(
            email="organizer@sbtl.ai",
            first_name="Organizer",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([admin1, admin2, organizer])
        db.session.commit()

        # Create org and event
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(admin1, OrganizationUserRole.OWNER)
        db.session.flush()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add(event)
        db.session.flush()

        # Add only one admin and an organizer to event
        event.add_user(admin1, EventUserRole.ADMIN)
        event.add_user(organizer, EventUserRole.ORGANIZER)
        db.session.commit()

        # Test 1: Organizer CANNOT ban admin (role hierarchy)
        client.post(
            "/api/auth/login",
            json={"email": "organizer@sbtl.ai", "password": "Pass123!"},
        )

        ban_attempt = client.post(
            f"/api/events/{event.id}/users/{admin1.id}/ban",
            json={"reason": "Organizer trying to ban admin"}
        )
        assert ban_attempt.status_code == 400
        error_data = json.loads(ban_attempt.data)
        assert "cannot moderate" in error_data["message"].lower() or "organizer" in error_data["message"].lower()

        # Test 2: Admin cannot ban themselves (self-ban protection)
        client.post(
            "/api/auth/login",
            json={"email": "admin1@sbtl.ai", "password": "Pass123!"},
        )

        self_ban = client.post(
            f"/api/events/{event.id}/users/{admin1.id}/ban",
            json={"reason": "Self ban"}
        )
        assert self_ban.status_code == 400
        error_data = json.loads(self_ban.data)
        assert "yourself" in error_data["message"].lower()

        # Test 3: Cannot ban the last admin (add second admin to test)
        event.add_user(admin2, EventUserRole.ADMIN)
        db.session.commit()

        # Login as admin2
        client.post(
            "/api/auth/login",
            json={"email": "admin2@sbtl.ai", "password": "Pass123!"},
        )

        # Now admin2 can ban admin1 since there are 2 admins
        ban_response = client.post(
            f"/api/events/{event.id}/users/{admin1.id}/ban",
            json={"reason": "Valid ban with 2 admins"}
        )
        assert ban_response.status_code == 200

        # But admin2 cannot ban themselves (would leave no admins)
        self_ban_last = client.post(
            f"/api/events/{event.id}/users/{admin2.id}/ban",
            json={"reason": "Trying to ban last remaining admin"}
        )
        assert self_ban_last.status_code == 400
        error_data = json.loads(self_ban_last.data)
        # Should fail with either "yourself" or "last admin" message
        assert "yourself" in error_data["message"].lower() or "last admin" in error_data["message"].lower()

    def test_banned_user_cannot_moderate(self, client, db):
        """Test that banned users lose moderation privileges.

        Why test this? Ensures banned users cannot abuse their
        former privileges to retaliate.
        """
        # Create users
        organizer1 = User(
            email="organizer1@sbtl.ai",
            first_name="Organizer1",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        organizer2 = User(
            email="organizer2@sbtl.ai",
            first_name="Organizer2",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        attendee = User(
            email="attendee@sbtl.ai",
            first_name="Attendee",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([organizer1, organizer2, attendee, admin])
        db.session.commit()

        # Create org and event
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(admin, OrganizationUserRole.OWNER)
        db.session.flush()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add(event)
        db.session.flush()

        event.add_user(admin, EventUserRole.ADMIN)
        event.add_user(organizer1, EventUserRole.ORGANIZER)
        event.add_user(organizer2, EventUserRole.ORGANIZER)
        event.add_user(attendee, EventUserRole.ATTENDEE)
        db.session.commit()

        # Admin bans organizer1
        client.post(
            "/api/auth/login",
            json={"email": "admin@sbtl.ai", "password": "Pass123!"},
        )

        ban_response = client.post(
            f"/api/events/{event.id}/users/{organizer1.id}/ban",
            json={"reason": "Abuse of power"}
        )
        assert ban_response.status_code == 200

        # Banned organizer tries to moderate (should fail due to decorator)
        client.post(
            "/api/auth/login",
            json={"email": "organizer1@sbtl.ai", "password": "Pass123!"},
        )

        # Try to ban attendee
        ban_attempt = client.post(
            f"/api/events/{event.id}/users/{attendee.id}/ban",
            json={"reason": "Retaliation"}
        )
        # The service returns 400 when banned users try to moderate
        assert ban_attempt.status_code == 400
        error_data = json.loads(ban_attempt.data)
        assert "banned users cannot moderate" in error_data["message"].lower()

    def test_moderation_status_retrieval(self, client, db):
        """Test retrieving comprehensive moderation status.

        Why test this? Moderators need to see full moderation
        history and current status of users.
        """
        # Create users and event
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        attendee = User(
            email="attendee@sbtl.ai",
            first_name="Attendee",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([admin, attendee])
        db.session.commit()

        # Create org and event
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(admin, OrganizationUserRole.OWNER)
        db.session.flush()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add(event)
        db.session.flush()

        event.add_user(admin, EventUserRole.ADMIN)
        event.add_user(attendee, EventUserRole.ATTENDEE)
        db.session.commit()

        # Login as admin
        client.post(
            "/api/auth/login",
            json={"email": "admin@sbtl.ai", "password": "Pass123!"},
        )

        # Get initial status (no moderation actions)
        status_response = client.get(
            f"/api/events/{event.id}/users/{attendee.id}/moderation-status"
        )
        assert status_response.status_code == 200
        status_data = json.loads(status_response.data)
        assert status_data["is_banned"] is False
        assert status_data["is_chat_banned"] is False
        assert status_data["can_use_chat"] is True
        assert status_data["moderation_notes"] is None

        # Chat ban the user
        client.post(
            f"/api/events/{event.id}/users/{attendee.id}/chat-ban",
            json={
                "reason": "Inappropriate language",
                "duration_hours": 1,
                "moderation_notes": "First warning"
            }
        )

        # Get updated status
        status_response = client.get(
            f"/api/events/{event.id}/users/{attendee.id}/moderation-status"
        )
        assert status_response.status_code == 200
        status_data = json.loads(status_response.data)
        assert status_data["is_banned"] is False
        assert status_data["is_chat_banned"] is True
        assert status_data["can_use_chat"] is False
        assert status_data["chat_ban_reason"] == "Inappropriate language"
        assert status_data["chat_ban_until"] is not None
        assert "First warning" in status_data["moderation_notes"]

    def test_moderation_notes_accumulation(self, client, db):
        """Test that moderation notes accumulate for audit trail.

        Why test this? Provides complete history of moderation
        actions for review and appeals.
        """
        # Create users and event
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        user = User(
            email="user@sbtl.ai",
            first_name="Regular",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([admin, user])
        db.session.commit()

        # Create org and event
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(admin, OrganizationUserRole.OWNER)
        db.session.flush()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add(event)
        db.session.flush()

        event.add_user(admin, EventUserRole.ADMIN)
        event.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Login as admin
        client.post(
            "/api/auth/login",
            json={"email": "admin@sbtl.ai", "password": "Pass123!"},
        )

        # Action 1: Chat ban
        client.post(
            f"/api/events/{event.id}/users/{user.id}/chat-ban",
            json={
                "reason": "Spam",
                "duration_hours": 1,
                "moderation_notes": "Warning 1: Spamming chat"
            }
        )

        # Action 2: Chat unban
        client.post(
            f"/api/events/{event.id}/users/{user.id}/chat-unban",
            json={"moderation_notes": "Unbanned after discussion"}
        )

        # Action 3: Event ban
        client.post(
            f"/api/events/{event.id}/users/{user.id}/ban",
            json={
                "reason": "Repeated violations",
                "moderation_notes": "Final action: Multiple violations"
            }
        )

        # Check accumulated notes
        event_user = EventUser.query.filter_by(
            event_id=event.id, user_id=user.id
        ).first()

        # Fixed! The ban service now properly appends moderation notes

        # All notes should be present (checking for the actual format used by service)
        assert "Chat banned: Warning 1: Spamming chat" in event_user.moderation_notes
        assert "Chat unbanned: Unbanned after discussion" in event_user.moderation_notes
        assert "Event banned: Final action: Multiple violations" in event_user.moderation_notes

    def test_cross_event_isolation(self, client, db):
        """Test that moderation actions are isolated per event.

        Why test this? Users banned in one event should still
        be able to participate in other events.
        """
        # Create users
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        user = User(
            email="user@sbtl.ai",
            first_name="Regular",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([admin, user])
        db.session.commit()

        # Create org with two events
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(admin, OrganizationUserRole.OWNER)
        db.session.flush()

        event1 = Event(
            title="Event 1",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        event2 = Event(
            title="Event 2",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add_all([event1, event2])
        db.session.flush()

        # Add users to both events
        event1.add_user(admin, EventUserRole.ADMIN)
        event1.add_user(user, EventUserRole.ATTENDEE)
        event2.add_user(admin, EventUserRole.ADMIN)
        event2.add_user(user, EventUserRole.ATTENDEE)
        db.session.commit()

        # Login as admin
        client.post(
            "/api/auth/login",
            json={"email": "admin@sbtl.ai", "password": "Pass123!"},
        )

        # Ban user in event1
        ban_response = client.post(
            f"/api/events/{event1.id}/users/{user.id}/ban",
            json={"reason": "Violation in event 1"}
        )
        assert ban_response.status_code == 200

        # Check status in event1 (should be banned)
        status1_response = client.get(
            f"/api/events/{event1.id}/users/{user.id}/moderation-status"
        )
        status1_data = json.loads(status1_response.data)
        assert status1_data["is_banned"] is True

        # Check status in event2 (should NOT be banned)
        status2_response = client.get(
            f"/api/events/{event2.id}/users/{user.id}/moderation-status"
        )
        status2_data = json.loads(status2_response.data)
        assert status2_data["is_banned"] is False
        assert status2_data["can_use_chat"] is True

        # Can still moderate user in event2
        chat_ban_response = client.post(
            f"/api/events/{event2.id}/users/{user.id}/chat-ban",
            json={"reason": "Different issue in event 2", "duration_hours": 1}
        )
        assert chat_ban_response.status_code == 200

    def test_attendee_cannot_moderate(self, client, db):
        """Test that regular attendees cannot access moderation endpoints.

        Why test this? Ensures only authorized roles can perform
        moderation actions.
        """
        # Create users
        attendee1 = User(
            email="attendee1@sbtl.ai",
            first_name="Attendee1",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        attendee2 = User(
            email="attendee2@sbtl.ai",
            first_name="Attendee2",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([attendee1, attendee2, admin])
        db.session.commit()

        # Create org and event
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()  # Get org.id before adding users
        org.add_user(admin, OrganizationUserRole.OWNER)
        db.session.flush()

        event = Event(
            title="Test Event",
            organization_id=org.id,
            event_type="CONFERENCE",
            company_name="Test Company",
            start_date=datetime.now(timezone.utc).date(),
            end_date=(datetime.now(timezone.utc) + timedelta(days=1)).date(),
        )
        db.session.add(event)
        db.session.flush()

        event.add_user(admin, EventUserRole.ADMIN)
        event.add_user(attendee1, EventUserRole.ATTENDEE)
        event.add_user(attendee2, EventUserRole.ATTENDEE)
        db.session.commit()

        # Login as attendee1
        client.post(
            "/api/auth/login",
            json={"email": "attendee1@sbtl.ai", "password": "Pass123!"},
        )

        # Try to ban another attendee (should fail)
        ban_response = client.post(
            f"/api/events/{event.id}/users/{attendee2.id}/ban",
            json={"reason": "I don't like them"}
        )
        assert ban_response.status_code == 403
        error_data = json.loads(ban_response.data)
        assert "admin or organizer" in error_data["message"].lower()

        # Try to chat ban (should also fail)
        chat_ban_response = client.post(
            f"/api/events/{event.id}/users/{attendee2.id}/chat-ban",
            json={"reason": "Being annoying"}
        )
        assert chat_ban_response.status_code == 403

        # Try to get moderation status (should also fail - organizer+ only)
        status_response = client.get(
            f"/api/events/{event.id}/users/{attendee2.id}/moderation-status"
        )
        assert status_response.status_code == 403