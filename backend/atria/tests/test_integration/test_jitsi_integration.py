"""Integration tests for Jitsi (JaaS) streaming platform.

Testing Strategy:
- Tests the FULL Jitsi stack: HTTP → Route → Service → Model → Database
- Validates JaaS credential management API
- Tests session creation with Jitsi platform
- Tests JWT token generation via playback-data endpoint
- Tests moderator permissions
- No mocking - tests the real implementation
"""

import pytest
import json
import jwt as pyjwt
from datetime import date, timedelta
from api.models import User, Organization, Event, Session
from api.models.enums import OrganizationUserRole, EventUserRole
from api.extensions import db


class TestJitsiCredentialManagement:
    """Test JaaS credential management through API"""

    def test_set_jaas_credentials_as_owner(self, client, db):
        """Test setting JaaS credentials as organization owner"""
        # Create owner user
        owner = User(
            email="owner@example.com",
            first_name="Owner",
            last_name="User",
            password="Password123!",
            email_verified=True
        )
        db.session.add(owner)
        db.session.commit()

        # Login
        client.post(
            "/api/auth/login",
            json={"email": "owner@example.com", "password": "Password123!"}
        )

        # Create organization
        org_response = client.post(
            "/api/organizations",
            json={"name": "Test Org"}
        )
        assert org_response.status_code == 201
        org_id = json.loads(org_response.data)["id"]

        # Generate test RSA key
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        # Set JaaS credentials (uses PUT, not POST)
        creds_response = client.put(
            f"/api/organizations/{org_id}/jaas-credentials",
            json={
                "jaas_app_id": "vpaas-magic-cookie-test123",
                "jaas_api_key": "test-api-key-xyz",
                "jaas_private_key": private_pem
            }
        )

        assert creds_response.status_code == 200
        data = json.loads(creds_response.data)
        # Endpoint returns OrganizationDetailSchema (full org object)
        assert data["has_jaas_credentials"] is True
        assert data["name"] == "Test Org"  # Verify it's the org response

    def test_delete_jaas_credentials_as_owner(self, client, db):
        """Test deleting JaaS credentials as organization owner"""
        # Create owner and org
        owner = User(
            email="owner@example.com",
            first_name="Owner",
            last_name="User",
            password="Password123!",
            email_verified=True
        )
        db.session.add(owner)
        db.session.commit()

        client.post(
            "/api/auth/login",
            json={"email": "owner@example.com", "password": "Password123!"}
        )

        org_response = client.post("/api/organizations", json={"name": "Test Org"})
        org_id = json.loads(org_response.data)["id"]

        # Set credentials first
        org = Organization.query.get(org_id)
        org.set_jaas_credentials(
            app_id="test-app-id",
            api_key="test-api-key",
            private_key="test-private-key"
        )
        db.session.commit()

        # Delete credentials (returns 204 No Content, matching Mux pattern)
        delete_response = client.delete(f"/api/organizations/{org_id}/jaas-credentials")

        assert delete_response.status_code == 204  # No Content

        # Verify deletion by checking model directly
        db.session.expire_all()
        org = Organization.query.get(org_id)
        assert org.has_jaas_credentials is False

    def test_set_jaas_credentials_as_non_owner_denied(self, client, db):
        """Test that non-owners cannot set JaaS credentials"""
        # Create owner and member
        owner = User(
            email="owner@example.com",
            first_name="Owner",
            last_name="User",
            password="Password123!",
            email_verified=True
        )
        member = User(
            email="member@example.com",
            first_name="Member",
            last_name="User",
            password="Password123!",
            email_verified=True
        )
        db.session.add(owner)
        db.session.add(member)
        db.session.commit()

        # Owner creates org
        client.post("/api/auth/login", json={"email": "owner@example.com", "password": "Password123!"})
        org_response = client.post("/api/organizations", json={"name": "Test Org"})
        org_id = json.loads(org_response.data)["id"]

        # Add member to org
        org = Organization.query.get(org_id)
        org.add_user(member, OrganizationUserRole.MEMBER)
        db.session.commit()

        # Login as member
        client.post("/api/auth/logout")
        client.post("/api/auth/login", json={"email": "member@example.com", "password": "Password123!"})

        # Try to set credentials (should fail - uses PUT)
        creds_response = client.put(
            f"/api/organizations/{org_id}/jaas-credentials",
            json={
                "jaas_app_id": "test-app-id",
                "jaas_api_key": "test-api-key",
                "jaas_private_key": "test-private-key"
            }
        )

        assert creds_response.status_code == 403  # Forbidden


class TestJitsiSessionCreation:
    """Test creating sessions with Jitsi streaming platform"""

    def _get_event_data(self, title='Test Event', **overrides):
        """Helper to get valid event data with defaults."""
        future_start = date.today() + timedelta(days=30)
        future_end = future_start + timedelta(days=1)

        data = {
            'title': title,
            'event_type': 'CONFERENCE',
            'start_date': future_start.isoformat(),
            'end_date': future_end.isoformat(),
            'company_name': 'Test Company',
            'timezone': 'UTC'
        }
        data.update(overrides)
        return data

    def test_create_session_with_jitsi(self, client, db):
        """Test creating session with Jitsi platform"""
        # Setup: Create owner, org, event
        owner = User(
            email="owner@example.com",
            first_name="Owner",
            last_name="User",
            password="Password123!",
            email_verified=True
        )
        db.session.add(owner)
        db.session.commit()

        client.post("/api/auth/login", json={"email": "owner@example.com", "password": "Password123!"})

        org_response = client.post("/api/organizations", json={"name": "Test Org"})
        org_id = json.loads(org_response.data)["id"]

        # Create event
        event_response = client.post(
            f"/api/organizations/{org_id}/events",
            json=self._get_event_data("Test Event")
        )
        assert event_response.status_code == 201
        event_id = json.loads(event_response.data)["id"]

        # Create session with Jitsi
        session_response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "Jitsi Workshop",
                "short_description": "Test session",
                "session_type": "WORKSHOP",
                "day_number": 1,
                "start_time": "10:00",
                "end_time": "11:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "JITSI",
                "jitsi_room_name": "my-workshop-room"
            }
        )

        assert session_response.status_code == 201
        data = json.loads(session_response.data)
        assert data["streaming_platform"] == "JITSI"
        assert data["jitsi_room_name"] == "my-workshop-room"

    def test_create_session_with_other_platform(self, client, db):
        """Test creating session with OTHER platform"""
        # Setup
        owner = User(
            email="owner@example.com",
            first_name="Owner",
            last_name="User",
            password="Password123!",
            email_verified=True
        )
        db.session.add(owner)
        db.session.commit()

        client.post("/api/auth/login", json={"email": "owner@example.com", "password": "Password123!"})
        org_response = client.post("/api/organizations", json={"name": "Test Org"})
        org_id = json.loads(org_response.data)["id"]

        event_response = client.post(
            f"/api/organizations/{org_id}/events",
            json=self._get_event_data("Test Event")
        )
        event_id = json.loads(event_response.data)["id"]

        # Create session with OTHER platform
        session_response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "MS Teams Session",
                "short_description": "External platform",
                "session_type": "KEYNOTE",
                "day_number": 1,
                "start_time": "14:00",
                "end_time": "15:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "OTHER",
                "stream_url": "https://teams.microsoft.com/l/meetup-join/..."
            }
        )

        assert session_response.status_code == 201
        data = json.loads(session_response.data)
        assert data["streaming_platform"] == "OTHER"
        assert data["stream_url"] == "https://teams.microsoft.com/l/meetup-join/..."


class TestJitsiPlaybackData:
    """Test playback-data endpoint for Jitsi JWT generation"""

    def _get_event_data(self, title='Test Event', **overrides):
        """Helper to get valid event data with defaults."""
        future_start = date.today() + timedelta(days=30)
        future_end = future_start + timedelta(days=1)

        data = {
            'title': title,
            'event_type': 'CONFERENCE',
            'start_date': future_start.isoformat(),
            'end_date': future_end.isoformat(),
            'company_name': 'Test Company',
            'timezone': 'UTC'
        }
        data.update(overrides)
        return data

    def test_get_jitsi_playback_data_as_attendee(self, client, db, app):
        """Test getting Jitsi playback data (JWT token) as attendee"""
        with app.app_context():
            # Setup: Create org with JaaS credentials
            owner = User(
                email="owner@example.com",
                first_name="Owner",
                last_name="User",
                password="Password123!",
                email_verified=True
            )
            attendee = User(
                email="attendee@example.com",
                first_name="Attendee",
                last_name="User",
                password="Password123!",
                email_verified=True
            )
            db.session.add(owner)
            db.session.add(attendee)
            db.session.commit()

            # Owner creates org
            client.post("/api/auth/login", json={"email": "owner@example.com", "password": "Password123!"})
            org_response = client.post("/api/organizations", json={"name": "Test Org"})
            org_id = json.loads(org_response.data)["id"]

            # Set JaaS credentials
            org = Organization.query.get(org_id)
            from cryptography.hazmat.primitives.asymmetric import rsa
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.backends import default_backend

            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ).decode('utf-8')

            org.set_jaas_credentials(
                app_id="vpaas-magic-cookie-test",
                api_key="test-api-key",
                private_key=private_pem
            )
            db.session.commit()

            # Create event
            event_response = client.post(
                f"/api/organizations/{org_id}/events",
                json=self._get_event_data("Test Event")
            )
            event_id = json.loads(event_response.data)["id"]

            # Add attendee to event
            event = Event.query.get(event_id)
            event.add_user(attendee, EventUserRole.ATTENDEE)
            db.session.commit()

            # Create Jitsi session
            session_response = client.post(
                f"/api/events/{event_id}/sessions",
                json={
                    "title": "Jitsi Session",
                    "session_type": "WORKSHOP",
                    "day_number": 1,
                    "start_time": "10:00",
                    "end_time": "11:00",
                    "chat_mode": "ENABLED",
                    "streaming_platform": "JITSI",
                    "jitsi_room_name": "test-room"
                }
            )
            session_id = json.loads(session_response.data)["id"]

            # Login as attendee
            client.post("/api/auth/logout")
            client.post("/api/auth/login", json={"email": "attendee@example.com", "password": "Password123!"})

            # Get playback data (should include JWT token)
            playback_response = client.get(f"/api/sessions/{session_id}/playback-data")

            assert playback_response.status_code == 200
            data = json.loads(playback_response.data)

            # Verify playback data structure
            assert data["platform"] == "JITSI"
            assert data["app_id"] == "vpaas-magic-cookie-test"
            assert data["room_name"] == "test-room"
            assert "token" in data
            assert "expires_at" in data

            # Verify JWT token structure
            token = data["token"]
            decoded = pyjwt.decode(token, options={"verify_signature": False})

            # Verify token claims
            assert decoded["aud"] == "jitsi"
            assert decoded["sub"] == "vpaas-magic-cookie-test"
            assert decoded["room"] == "test-room"
            assert decoded["context"]["user"]["email"] == "attendee@example.com"
            assert decoded["context"]["user"]["moderator"] == "false"  # Attendee, not moderator
            assert decoded["context"]["features"]["recording"] == "false"  # No recording permission

    def test_get_jitsi_playback_data_as_event_admin(self, client, db, app):
        """Test that event admins get moderator permissions in JWT"""
        with app.app_context():
            # Setup
            admin = User(
                email="admin@example.com",
                first_name="Admin",
                last_name="User",
                password="Password123!",
                email_verified=True
            )
            db.session.add(admin)
            db.session.commit()

            # Admin creates org and event
            client.post("/api/auth/login", json={"email": "admin@example.com", "password": "Password123!"})
            org_response = client.post("/api/organizations", json={"name": "Test Org"})
            org_id = json.loads(org_response.data)["id"]

            # Set JaaS credentials
            org = Organization.query.get(org_id)
            from cryptography.hazmat.primitives.asymmetric import rsa
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.backends import default_backend

            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ).decode('utf-8')

            org.set_jaas_credentials(
                app_id="vpaas-magic-cookie-test",
                api_key="test-api-key",
                private_key=private_pem
            )
            db.session.commit()

            # Create event (admin is automatically EVENT ADMIN)
            event_response = client.post(
                f"/api/organizations/{org_id}/events",
                json=self._get_event_data("Test Event")
            )
            event_id = json.loads(event_response.data)["id"]

            # Create Jitsi session
            session_response = client.post(
                f"/api/events/{event_id}/sessions",
                json={
                    "title": "Jitsi Session",
                    "session_type": "PANEL",
                    "day_number": 1,
                    "start_time": "14:00",
                    "end_time": "15:00",
                    "chat_mode": "ENABLED",
                    "streaming_platform": "JITSI",
                    "jitsi_room_name": "admin-test-room"
                }
            )
            session_id = json.loads(session_response.data)["id"]

            # Get playback data as event admin
            playback_response = client.get(f"/api/sessions/{session_id}/playback-data")

            assert playback_response.status_code == 200
            data = json.loads(playback_response.data)

            # Verify JWT token has moderator permissions
            token = data["token"]
            decoded = pyjwt.decode(token, options={"verify_signature": False})

            assert decoded["context"]["user"]["moderator"] == "true"  # Admin is moderator
            assert decoded["context"]["features"]["recording"] == "true"  # Has recording
            assert decoded["context"]["features"]["livestreaming"] == "true"  # Has livestreaming


class TestOtherPlatformPlaybackData:
    """Test playback-data endpoint for OTHER platform"""

    def _get_event_data(self, title='Test Event', **overrides):
        """Helper to get valid event data with defaults."""
        future_start = date.today() + timedelta(days=30)
        future_end = future_start + timedelta(days=1)

        data = {
            'title': title,
            'event_type': 'CONFERENCE',
            'start_date': future_start.isoformat(),
            'end_date': future_end.isoformat(),
            'company_name': 'Test Company',
            'timezone': 'UTC'
        }
        data.update(overrides)
        return data

    def test_get_other_platform_playback_data(self, client, db, app):
        """Test getting playback data for OTHER platform (simple URL)"""
        with app.app_context():
            # Setup
            owner = User(
                email="owner@example.com",
                first_name="Owner",
                last_name="User",
                password="Password123!",
                email_verified=True
            )
            db.session.add(owner)
            db.session.commit()

            client.post("/api/auth/login", json={"email": "owner@example.com", "password": "Password123!"})
            org_response = client.post("/api/organizations", json={"name": "Test Org"})
            org_id = json.loads(org_response.data)["id"]

            # Create event
            event_response = client.post(
                f"/api/organizations/{org_id}/events",
                json=self._get_event_data("Test Event")
            )
            event_id = json.loads(event_response.data)["id"]

            # Create OTHER platform session
            external_url = "https://whereby.com/my-event-room"
            session_response = client.post(
                f"/api/events/{event_id}/sessions",
                json={
                    "title": "External Session",
                    "session_type": "NETWORKING",
                    "day_number": 1,
                    "start_time": "16:00",
                    "end_time": "17:00",
                    "chat_mode": "ENABLED",
                    "streaming_platform": "OTHER",
                    "stream_url": external_url
                }
            )
            session_id = json.loads(session_response.data)["id"]

            # Get playback data (should just return URL, no tokens)
            playback_response = client.get(f"/api/sessions/{session_id}/playback-data")

            assert playback_response.status_code == 200
            data = json.loads(playback_response.data)

            # Verify playback data structure
            assert data["platform"] == "OTHER"
            assert data["playback_url"] == external_url  # Uses playback_url like VIMEO
            assert "token" not in data  # OTHER platform doesn't need tokens
