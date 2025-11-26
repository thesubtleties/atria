"""Integration tests for all streaming platforms.

Testing Strategy:
- Tests ALL streaming platforms: VIMEO, MUX, ZOOM, JITSI, OTHER
- Validates platform-specific field requirements
- Tests switching between platforms
- Tests playback-data endpoint for each platform
- No mocking - tests the real implementation
"""

import pytest
import json
from datetime import date, timedelta
from api.models import User, Organization, Event, Session
from api.models.enums import EventUserRole
from api.extensions import db


class TestAllStreamingPlatforms:
    """Test all streaming platforms through full stack"""

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

    @pytest.fixture
    def setup_event(self, client, db):
        """Setup organization and event for testing"""
        # Create owner
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
        client.post("/api/auth/login", json={"email": "owner@example.com", "password": "Password123!"})

        # Create org
        org_response = client.post("/api/organizations", json={"name": "Test Org"})
        org_id = json.loads(org_response.data)["id"]

        # Create event
        event_response = client.post(
            f"/api/organizations/{org_id}/events",
            json=self._get_event_data("Multi-Platform Event")
        )
        assert event_response.status_code == 201, f"Event creation failed: {event_response.data}"
        event_id = json.loads(event_response.data)["id"]

        return {"org_id": org_id, "event_id": event_id}

    def test_create_vimeo_session(self, client, db, setup_event):
        """Test creating session with VIMEO platform"""
        event_id = setup_event["event_id"]

        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "Vimeo Session",
                "session_type": "KEYNOTE",
                "day_number": 1,
                "start_time": "09:00",
                "end_time": "10:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "VIMEO",
                "stream_url": "123456789"
            }
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["streaming_platform"] == "VIMEO"
        assert data["stream_url"] == "123456789"

    def test_create_mux_session(self, client, db, setup_event):
        """Test creating session with MUX platform"""
        event_id = setup_event["event_id"]

        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "Mux Session",
                "session_type": "WORKSHOP",
                "day_number": 1,
                "start_time": "10:00",
                "end_time": "11:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "MUX",
                "stream_url": "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe",
                "mux_playback_policy": "PUBLIC"
            }
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["streaming_platform"] == "MUX"
        assert data["stream_url"] == "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
        assert data["mux_playback_policy"] == "PUBLIC"

    def test_create_zoom_session(self, client, db, setup_event):
        """Test creating session with ZOOM platform"""
        event_id = setup_event["event_id"]

        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "Zoom Session",
                "session_type": "PANEL",
                "day_number": 1,
                "start_time": "11:00",
                "end_time": "12:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "ZOOM",
                "zoom_meeting_id": "1234567890",
                "zoom_passcode": "abc123"
            }
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["streaming_platform"] == "ZOOM"
        assert data["zoom_meeting_id"] == "https://zoom.us/j/1234567890"  # Normalized

    def test_create_jitsi_session(self, client, db, setup_event):
        """Test creating session with JITSI platform"""
        event_id = setup_event["event_id"]

        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "Jitsi Session",
                "session_type": "WORKSHOP",
                "day_number": 1,
                "start_time": "13:00",
                "end_time": "14:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "JITSI",
                "jitsi_room_name": "my-workshop-room"
            }
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["streaming_platform"] == "JITSI"
        assert data["jitsi_room_name"] == "my-workshop-room"

    def test_create_other_session(self, client, db, setup_event):
        """Test creating session with OTHER platform"""
        event_id = setup_event["event_id"]

        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "External Platform Session",
                "session_type": "NETWORKING",
                "day_number": 1,
                "start_time": "14:00",
                "end_time": "15:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "OTHER",
                "stream_url": "https://whereby.com/my-room"
            }
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["streaming_platform"] == "OTHER"
        assert data["stream_url"] == "https://whereby.com/my-room"

    def test_create_session_no_platform(self, client, db, setup_event):
        """Test creating session without streaming platform"""
        event_id = setup_event["event_id"]

        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "No Streaming Session",
                "session_type": "NETWORKING",
                "day_number": 1,
                "start_time": "15:00",
                "end_time": "16:00",
                "chat_mode": "DISABLED"
                # No streaming_platform specified
            }
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data.get("streaming_platform") is None


class TestPlatformSwitching:
    """Test switching between streaming platforms"""

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

    @pytest.fixture
    def setup_session(self, client, db):
        """Setup organization, event, and session for testing"""
        # Create owner
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

        # Create org and event
        org_response = client.post("/api/organizations", json={"name": "Test Org"})
        org_id = json.loads(org_response.data)["id"]

        event_response = client.post(
            f"/api/organizations/{org_id}/events",
            json=self._get_event_data("Test Event")
        )
        event_id = json.loads(event_response.data)["id"]

        # Create initial session with VIMEO
        session_response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "Test Session",
                "session_type": "WORKSHOP",
                "day_number": 1,
                "start_time": "10:00",
                "end_time": "11:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "VIMEO",
                "stream_url": "123456789"
            }
        )
        session_id = json.loads(session_response.data)["id"]

        return {"event_id": event_id, "session_id": session_id}

    def test_switch_from_vimeo_to_jitsi(self, client, db, setup_session):
        """Test switching platform from VIMEO to JITSI"""
        session_id = setup_session["session_id"]

        # Update to JITSI
        response = client.put(
            f"/api/sessions/{session_id}",
            json={
                "streaming_platform": "JITSI",
                "stream_url": None,  # Clear old field
                "jitsi_room_name": "new-jitsi-room"
            }
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["streaming_platform"] == "JITSI"
        assert data["jitsi_room_name"] == "new-jitsi-room"
        assert data.get("stream_url") is None

    def test_switch_from_jitsi_to_zoom(self, client, db, setup_session):
        """Test switching platform from JITSI to ZOOM"""
        session_id = setup_session["session_id"]

        # First switch to JITSI
        client.put(
            f"/api/sessions/{session_id}",
            json={
                "streaming_platform": "JITSI",
                "stream_url": None,
                "jitsi_room_name": "test-room"
            }
        )

        # Then switch to ZOOM
        response = client.put(
            f"/api/sessions/{session_id}",
            json={
                "streaming_platform": "ZOOM",
                "jitsi_room_name": None,  # Clear old field
                "zoom_meeting_id": "9876543210",
                "zoom_passcode": "pass123"
            }
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["streaming_platform"] == "ZOOM"
        assert data["zoom_meeting_id"] == "https://zoom.us/j/9876543210"
        assert data.get("jitsi_room_name") is None

    def test_switch_to_no_platform(self, client, db, setup_session):
        """Test removing streaming platform"""
        session_id = setup_session["session_id"]

        # Remove platform
        response = client.put(
            f"/api/sessions/{session_id}",
            json={
                "streaming_platform": None,
                "stream_url": None
            }
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data.get("streaming_platform") is None


class TestPlatformValidation:
    """Test platform-specific field validation"""

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

    @pytest.fixture
    def setup_event(self, client, db):
        """Setup organization and event"""
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

        return event_id

    def test_vimeo_requires_stream_url(self, client, db, setup_event):
        """Test that VIMEO platform requires stream_url"""
        event_id = setup_event

        # Try to create VIMEO session without stream_url
        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "Vimeo Session",
                "session_type": "KEYNOTE",
                "day_number": 1,
                "start_time": "09:00",
                "end_time": "10:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "VIMEO"
                # Missing stream_url
            }
        )

        # Should fail validation
        assert response.status_code == 422

    def test_zoom_requires_meeting_id(self, client, db, setup_event):
        """Test that ZOOM platform requires zoom_meeting_id"""
        event_id = setup_event

        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "Zoom Session",
                "session_type": "PANEL",
                "day_number": 1,
                "start_time": "10:00",
                "end_time": "11:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "ZOOM"
                # Missing zoom_meeting_id
            }
        )

        # Should fail validation
        assert response.status_code == 422

    def test_jitsi_requires_room_name(self, client, db, setup_event):
        """Test that JITSI platform requires jitsi_room_name"""
        event_id = setup_event

        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "Jitsi Session",
                "session_type": "WORKSHOP",
                "day_number": 1,
                "start_time": "11:00",
                "end_time": "12:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "JITSI"
                # Missing jitsi_room_name
            }
        )

        # Should fail validation
        assert response.status_code == 422

    def test_other_requires_https_url(self, client, db, setup_event):
        """Test that OTHER platform requires HTTPS URL"""
        event_id = setup_event

        # Try with HTTP (not HTTPS)
        response = client.post(
            f"/api/events/{event_id}/sessions",
            json={
                "title": "External Session",
                "session_type": "NETWORKING",
                "day_number": 1,
                "start_time": "12:00",
                "end_time": "13:00",
                "chat_mode": "ENABLED",
                "streaming_platform": "OTHER",
                "stream_url": "http://example.com/stream"  # HTTP not allowed
            }
        )

        # Should fail validation
        assert response.status_code == 422


class TestPlaybackDataAllPlatforms:
    """Test playback-data endpoint returns correct format for each platform"""

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

    @pytest.fixture
    def setup_with_sessions(self, client, db, app):
        """Setup org, event, and sessions for all platforms"""
        with app.app_context():
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

            # Create org and event
            org_response = client.post("/api/organizations", json={"name": "Test Org"})
            org_id = json.loads(org_response.data)["id"]

            event_response = client.post(
                f"/api/organizations/{org_id}/events",
                json=self._get_event_data("Test Event")
            )
            event_id = json.loads(event_response.data)["id"]

            # Create sessions for each platform
            sessions = {}

            # VIMEO
            vimeo_response = client.post(
                f"/api/events/{event_id}/sessions",
                json={
                    "title": "Vimeo Session",
                    "session_type": "KEYNOTE",
                    "day_number": 1,
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "chat_mode": "ENABLED",
                    "streaming_platform": "VIMEO",
                    "stream_url": "987654321"
                }
            )
            sessions["vimeo"] = json.loads(vimeo_response.data)["id"]

            # MUX PUBLIC
            mux_response = client.post(
                f"/api/events/{event_id}/sessions",
                json={
                    "title": "Mux Session",
                    "session_type": "WORKSHOP",
                    "day_number": 1,
                    "start_time": "10:00",
                    "end_time": "11:00",
                    "chat_mode": "ENABLED",
                    "streaming_platform": "MUX",
                    "stream_url": "TEST123PLAYBACKID",
                    "mux_playback_policy": "PUBLIC"
                }
            )
            sessions["mux"] = json.loads(mux_response.data)["id"]

            # ZOOM
            zoom_response = client.post(
                f"/api/events/{event_id}/sessions",
                json={
                    "title": "Zoom Session",
                    "session_type": "PANEL",
                    "day_number": 1,
                    "start_time": "11:00",
                    "end_time": "12:00",
                    "chat_mode": "ENABLED",
                    "streaming_platform": "ZOOM",
                    "zoom_meeting_id": "1112223333",
                    "zoom_passcode": "test123"
                }
            )
            sessions["zoom"] = json.loads(zoom_response.data)["id"]

            # OTHER
            other_response = client.post(
                f"/api/events/{event_id}/sessions",
                json={
                    "title": "External Session",
                    "session_type": "NETWORKING",
                    "day_number": 1,
                    "start_time": "13:00",
                    "end_time": "14:00",
                    "chat_mode": "ENABLED",
                    "streaming_platform": "OTHER",
                    "stream_url": "https://daily.co/test-room"
                }
            )
            sessions["other"] = json.loads(other_response.data)["id"]

            return sessions

    def test_vimeo_playback_data_format(self, client, db, app, setup_with_sessions):
        """Test VIMEO playback data format"""
        session_id = setup_with_sessions["vimeo"]

        response = client.get(f"/api/sessions/{session_id}/playback-data")

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["platform"] == "VIMEO"
        assert data["playback_url"] == "987654321"

    def test_mux_public_playback_data_format(self, client, db, app, setup_with_sessions):
        """Test MUX PUBLIC playback data format"""
        session_id = setup_with_sessions["mux"]

        response = client.get(f"/api/sessions/{session_id}/playback-data")

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["platform"] == "MUX"
        assert "TEST123PLAYBACKID" in data["playback_url"]
        assert data["playback_policy"] == "PUBLIC"
        assert data["tokens"] is None  # PUBLIC doesn't need tokens

    def test_zoom_playback_data_format(self, client, db, app, setup_with_sessions):
        """Test ZOOM playback data format"""
        session_id = setup_with_sessions["zoom"]

        response = client.get(f"/api/sessions/{session_id}/playback-data")

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["platform"] == "ZOOM"
        assert "1112223333" in data["join_url"]
        assert data["passcode"] == "test123"

    def test_other_playback_data_format(self, client, db, app, setup_with_sessions):
        """Test OTHER playback data format"""
        session_id = setup_with_sessions["other"]

        response = client.get(f"/api/sessions/{session_id}/playback-data")

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["platform"] == "OTHER"
        assert data["playback_url"] == "https://daily.co/test-room"  # Uses playback_url like VIMEO
