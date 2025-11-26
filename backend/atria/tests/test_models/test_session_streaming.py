"""
Tests for Session model streaming platform functionality.

Tests Jitsi and Other platform field storage and playback data generation.
"""
import pytest
from datetime import time
from api.models import Session, Event, Organization, User
from api.models.enums import SessionType, SessionChatMode, SessionStatus
from tests.factories.user_factory import UserFactory
from tests.factories.event_factory import EventFactory
from tests.factories.organization_factory import OrganizationFactory


class TestSessionJitsiFields:
    """Test Session model Jitsi room name storage"""

    def test_session_with_jitsi_room_name(self, db):
        """Test creating session with Jitsi platform and room name"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        session = Session(
            event_id=event.id,
            title="Jitsi Workshop",
            short_description="Test session",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            session_type=SessionType.WORKSHOP,
            status=SessionStatus.SCHEDULED,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='JITSI',
            jitsi_room_name='tech-workshop-2024'
        )
        db.session.add(session)
        db.session.commit()

        # Verify fields saved correctly
        assert session.id is not None
        assert session.streaming_platform == 'JITSI'
        assert session.jitsi_room_name == 'tech-workshop-2024'

        # Verify other platform fields are None
        assert session.stream_url is None
        assert session.zoom_meeting_id is None

    def test_session_jitsi_room_name_roundtrip(self, db):
        """Test saving and reloading Jitsi room name from database"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        session = Session(
            event_id=event.id,
            title="Test Session",
            start_time=time(14, 0),
            end_time=time(15, 0),
            day_number=1,
            session_type=SessionType.PANEL,
            status=SessionStatus.SCHEDULED,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='JITSI',
            jitsi_room_name='my-panel-discussion'
        )
        db.session.add(session)
        db.session.commit()
        session_id = session.id

        # Clear session and reload
        db.session.expire_all()
        reloaded = Session.query.get(session_id)

        assert reloaded.streaming_platform == 'JITSI'
        assert reloaded.jitsi_room_name == 'my-panel-discussion'

    def test_session_jitsi_update_room_name(self, db):
        """Test updating Jitsi room name"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        session = Session(
            event_id=event.id,
            title="Test Session",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            session_type=SessionType.WORKSHOP,
            status=SessionStatus.SCHEDULED,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='JITSI',
            jitsi_room_name='old-room-name'
        )
        db.session.add(session)
        db.session.commit()

        # Update room name
        session.jitsi_room_name = 'new-room-name-2024'
        db.session.commit()

        # Verify update
        db.session.expire_all()
        reloaded = Session.query.get(session.id)
        assert reloaded.jitsi_room_name == 'new-room-name-2024'

    def test_session_jitsi_various_room_formats(self, db):
        """Test various valid Jitsi room name formats"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        room_names = [
            'simple-room',
            'room-with-numbers-123',
            'very-long-room-name-' + 'x' * 180,  # Up to 200 chars
            'abc',  # Minimum 3 chars
        ]

        for room_name in room_names:
            session = Session(
                event_id=event.id,
                title=f"Session {room_name}",
                start_time=time(10, 0),
                end_time=time(11, 0),
                day_number=1,
                session_type=SessionType.PRESENTATION,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED,
                streaming_platform='JITSI',
                jitsi_room_name=room_name
            )
            db.session.add(session)
            db.session.commit()

            assert session.jitsi_room_name == room_name
            db.session.delete(session)
            db.session.commit()


class TestSessionOtherPlatformFields:
    """Test Session model OTHER platform URL storage"""

    def test_session_with_other_platform(self, db):
        """Test creating session with OTHER platform using stream_url"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        session = Session(
            event_id=event.id,
            title="MS Teams Session",
            short_description="External platform",
            start_time=time(13, 0),
            end_time=time(14, 30),
            day_number=2,
            session_type=SessionType.KEYNOTE,
            status=SessionStatus.SCHEDULED,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='OTHER',
            stream_url='https://teams.microsoft.com/l/meetup-join/...'
        )
        db.session.add(session)
        db.session.commit()

        # Verify fields saved correctly
        assert session.id is not None
        assert session.streaming_platform == 'OTHER'
        assert session.stream_url == 'https://teams.microsoft.com/l/meetup-join/...'

        # Verify other platform fields are None
        assert session.jitsi_room_name is None
        assert session.zoom_meeting_id is None

    def test_session_other_stream_url_roundtrip(self, db):
        """Test saving and reloading OTHER platform URL from database"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        external_url = 'https://whereby.com/my-event-room'

        session = Session(
            event_id=event.id,
            title="External Stream",
            start_time=time(15, 0),
            end_time=time(16, 0),
            day_number=1,
            session_type=SessionType.NETWORKING,
            status=SessionStatus.SCHEDULED,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='OTHER',
            stream_url=external_url
        )
        db.session.add(session)
        db.session.commit()
        session_id = session.id

        # Clear session and reload
        db.session.expire_all()
        reloaded = Session.query.get(session_id)

        assert reloaded.streaming_platform == 'OTHER'
        assert reloaded.stream_url == external_url

    def test_session_other_platform_various_urls(self, db):
        """Test OTHER platform with various external URLs"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        external_urls = [
            'https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc',
            'https://whereby.com/my-room',
            'https://daily.co/event-room',
            'https://streamyard.com/watch/abc123',
            'https://meet.jit.si/custom-room',  # Self-hosted Jitsi
        ]

        for url in external_urls:
            session = Session(
                event_id=event.id,
                title=f"Session {url}",
                start_time=time(10, 0),
                end_time=time(11, 0),
                day_number=1,
                session_type=SessionType.PRESENTATION,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED,
                streaming_platform='OTHER',
                stream_url=url
            )
            db.session.add(session)
            db.session.commit()

            assert session.stream_url == url
            db.session.delete(session)
            db.session.commit()


class TestSessionPlatformSwitching:
    """Test switching between streaming platforms"""

    def test_switch_from_vimeo_to_jitsi(self, db):
        """Test switching platform from VIMEO to JITSI"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        # Create with VIMEO
        session = Session(
            event_id=event.id,
            title="Test Session",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            session_type=SessionType.WORKSHOP,
            status=SessionStatus.SCHEDULED,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='VIMEO',
            stream_url='123456789'
        )
        db.session.add(session)
        db.session.commit()

        # Switch to JITSI
        session.streaming_platform = 'JITSI'
        session.stream_url = None  # Clear old field
        session.jitsi_room_name = 'my-jitsi-room'
        db.session.commit()

        # Verify switch
        assert session.streaming_platform == 'JITSI'
        assert session.jitsi_room_name == 'my-jitsi-room'
        assert session.stream_url is None

    def test_switch_from_jitsi_to_other(self, db):
        """Test switching platform from JITSI to OTHER"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        # Create with JITSI
        session = Session(
            event_id=event.id,
            title="Test Session",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            session_type=SessionType.PANEL,
            status=SessionStatus.SCHEDULED,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='JITSI',
            jitsi_room_name='old-room'
        )
        db.session.add(session)
        db.session.commit()

        # Switch to OTHER
        session.streaming_platform = 'OTHER'
        session.jitsi_room_name = None  # Clear old field
        session.stream_url = 'https://teams.microsoft.com/...'
        db.session.commit()

        # Verify switch
        assert session.streaming_platform == 'OTHER'
        assert session.stream_url == 'https://teams.microsoft.com/...'
        assert session.jitsi_room_name is None


class TestGetPlaybackDataOther:
    """Test get_playback_data() for OTHER platform"""

    def test_get_playback_data_other_platform(self, app, db):
        """Test playback data structure for OTHER platform"""
        with app.app_context():
            org = OrganizationFactory()
            event = EventFactory(organization_id=org.id)

            external_url = 'https://whereby.com/my-event'

            session = Session(
                event_id=event.id,
                title="External Stream",
                start_time=time(14, 0),
                end_time=time(15, 0),
                day_number=1,
                session_type=SessionType.PRESENTATION,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED,
                streaming_platform='OTHER',
                stream_url=external_url
            )
            db.session.add(session)
            db.session.commit()

            # Get playback data
            playback_data = session.get_playback_data()

            # Verify structure
            assert playback_data is not None
            assert playback_data["platform"] == "OTHER"
            assert playback_data["playback_url"] == external_url  # Uses playback_url like VIMEO

    def test_get_playback_data_no_platform(self, app, db):
        """Test playback data returns None when no platform configured"""
        with app.app_context():
            org = OrganizationFactory()
            event = EventFactory(organization_id=org.id)

            session = Session(
                event_id=event.id,
                title="No Platform Session",
                start_time=time(10, 0),
                end_time=time(11, 0),
                day_number=1,
                session_type=SessionType.NETWORKING,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.DISABLED,
                streaming_platform=None
            )
            db.session.add(session)
            db.session.commit()

            # Get playback data
            playback_data = session.get_playback_data()

            # Should return None
            assert playback_data is None


class TestStreamingPlatformEnum:
    """Test streaming platform enum values"""

    def test_all_platform_enums(self, db):
        """Test that all streaming platform values are supported"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        platforms = ['VIMEO', 'MUX', 'ZOOM', 'JITSI', 'OTHER']

        for platform in platforms:
            session = Session(
                event_id=event.id,
                title=f"{platform} Session",
                start_time=time(10, 0),
                end_time=time(11, 0),
                day_number=1,
                session_type=SessionType.WORKSHOP,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED,
                streaming_platform=platform
            )
            db.session.add(session)
            db.session.commit()

            assert session.streaming_platform == platform
            db.session.delete(session)
            db.session.commit()

    def test_null_platform_allowed(self, db):
        """Test that NULL/None platform is allowed (no streaming)"""
        org = OrganizationFactory()
        event = EventFactory(organization_id=org.id)

        session = Session(
            event_id=event.id,
            title="No Streaming Session",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            session_type=SessionType.NETWORKING,
            status=SessionStatus.SCHEDULED,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform=None
        )
        db.session.add(session)
        db.session.commit()

        assert session.streaming_platform is None
