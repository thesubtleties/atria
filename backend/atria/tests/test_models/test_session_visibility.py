"""Test Session visibility window computed properties.

Testing Strategy:
- Visibility windows control when session content is accessible
- Session can override event default, or fall back to it
- Window timing is relative to session start/end times
- VOD auto-detection for Vimeo/Mux platforms
"""

import pytest
from datetime import datetime, time, timedelta, timezone
from api.models import Session, Event
from api.models.enums import SessionStatus, SessionType, SessionChatMode


class TestSessionVisibilityWindow:
    """Test visibility window computed properties."""

    def test_effective_visibility_uses_session_override(self, db, event_factory):
        """Test that session override takes priority over event default.

        Why test this? Sessions need to be able to override the event-level
        default for special cases (demos, recordings, etc).
        """
        event = event_factory()
        event.session_visibility_minutes = 10  # Event default: 10 minutes
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Override Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            visibility_minutes_override=5,  # Session override: 5 minutes
        )
        db.session.add(session)
        db.session.commit()

        # Session override should win
        assert session.effective_visibility_minutes == 5

    def test_effective_visibility_falls_back_to_event_default(self, db, event_factory):
        """Test that NULL session override falls back to event default.

        Why test this? Most sessions should use the event default,
        only overriding when necessary.
        """
        event = event_factory()
        event.session_visibility_minutes = 15
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Fallback Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            visibility_minutes_override=None,  # Use event default
        )
        db.session.add(session)
        db.session.commit()

        # Should fall back to event default
        assert session.effective_visibility_minutes == 15

    def test_effective_visibility_zero_means_always_on(self, db, event_factory):
        """Test that 0 visibility minutes means always on (returns None).

        Why test this? 0 is an explicit "always on" setting, different from
        NULL which means "use default". Both should result in None (always on).
        """
        event = event_factory()
        event.session_visibility_minutes = 10
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Always On Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            visibility_minutes_override=0,  # Explicitly always on
        )
        db.session.add(session)
        db.session.commit()

        # 0 should return None (always on)
        assert session.effective_visibility_minutes is None

    def test_effective_visibility_null_event_default_means_always_on(self, db, event_factory):
        """Test that NULL event default with NULL session override means always on.

        Why test this? This is the backward-compatible default behavior.
        """
        event = event_factory()
        event.session_visibility_minutes = None  # Event default: always on
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Default Always On Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            visibility_minutes_override=None,  # Use event default
        )
        db.session.add(session)
        db.session.commit()

        # Both NULL should mean always on
        assert session.effective_visibility_minutes is None

    def test_window_opens_at_returns_none_when_always_on(self, db, event_factory):
        """Test that window_opens_at returns None for always-on sessions.

        Why test this? Frontend needs to know there's no window restriction.
        """
        event = event_factory()
        event.session_visibility_minutes = None
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="No Window Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
        )
        db.session.add(session)
        db.session.commit()

        assert session.window_opens_at is None
        assert session.window_closes_at is None

    def test_window_opens_at_calculates_correctly(self, db, event_factory):
        """Test that window opens X minutes before session start.

        Why test this? The core timing logic must be correct for the
        feature to work properly.
        """
        event = event_factory()
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Window Timing Test",
            start_time=time(14, 0),  # 2:00 PM
            end_time=time(15, 0),    # 3:00 PM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            visibility_minutes_override=10,  # 10 minutes before/after
        )
        db.session.add(session)
        db.session.commit()

        # Window should open 10 minutes before session start
        window_open = session.window_opens_at
        session_start = session.start_datetime

        assert window_open is not None
        assert session_start - window_open == timedelta(minutes=10)

    def test_window_closes_at_calculates_correctly(self, db, event_factory):
        """Test that window closes X minutes after session end.

        Why test this? Attendees need access for Q&A after the session.
        """
        event = event_factory()
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Window Close Test",
            start_time=time(14, 0),  # 2:00 PM
            end_time=time(15, 0),    # 3:00 PM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            visibility_minutes_override=10,
        )
        db.session.add(session)
        db.session.commit()

        # Window should close 10 minutes after session end
        window_close = session.window_closes_at
        session_end = session.end_datetime

        assert window_close is not None
        assert window_close - session_end == timedelta(minutes=10)

    def test_is_window_open_always_true_for_always_on(self, db, event_factory):
        """Test that is_window_open is True for always-on sessions.

        Why test this? Always-on sessions should never be blocked.
        """
        event = event_factory()
        event.session_visibility_minutes = None
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Always Open Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
        )
        db.session.add(session)
        db.session.commit()

        # Always-on sessions are always open
        assert session.is_window_open is True

    def test_window_state_returns_open_for_always_on(self, db, event_factory):
        """Test that window_state returns 'open' for always-on sessions.

        Why test this? Frontend uses window_state to determine what to show.
        """
        event = event_factory()
        event.session_visibility_minutes = None
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="State Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
        )
        db.session.add(session)
        db.session.commit()

        # Always-on sessions have 'open' state
        assert session.window_state == 'open'


class TestSessionVodDetection:
    """Test VOD (Video on Demand) detection logic."""

    def test_has_vod_with_explicit_vod_url(self, db, event_factory):
        """Test that explicit vod_url is detected.

        Why test this? Manual VOD URL takes priority over auto-detection.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Manual VOD Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform=None,
            vod_url="https://vimeo.com/123456789",
        )
        db.session.add(session)
        db.session.commit()

        assert session.has_vod is True

    def test_has_vod_auto_detects_vimeo(self, db, event_factory):
        """Test that Vimeo streams are auto-detected as VOD.

        Why test this? Vimeo embeds work as VOD after stream ends.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Vimeo Auto-VOD Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='VIMEO',
            stream_url="123456789",
            vod_url=None,  # No manual VOD
        )
        db.session.add(session)
        db.session.commit()

        assert session.has_vod is True

    def test_has_vod_auto_detects_mux(self, db, event_factory):
        """Test that Mux streams are auto-detected as VOD.

        Why test this? Mux playback IDs work for VOD after stream.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Mux Auto-VOD Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='MUX',
            stream_url="playback-id-123",
            vod_url=None,
        )
        db.session.add(session)
        db.session.commit()

        assert session.has_vod is True

    def test_has_vod_false_for_zoom(self, db, event_factory):
        """Test that Zoom sessions don't have auto-VOD.

        Why test this? Zoom is an external platform, no auto-recording.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Zoom No-VOD Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='ZOOM',
            zoom_meeting_id="123456789",
            vod_url=None,
        )
        db.session.add(session)
        db.session.commit()

        assert session.has_vod is False

    def test_has_vod_false_for_jitsi(self, db, event_factory):
        """Test that Jitsi sessions don't have auto-VOD.

        Why test this? Jitsi is an external platform, no auto-recording.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Jitsi No-VOD Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='JITSI',
            jitsi_room_name="my-room",
            vod_url=None,
        )
        db.session.add(session)
        db.session.commit()

        assert session.has_vod is False

    def test_has_vod_false_for_no_streaming(self, db, event_factory):
        """Test that sessions without streaming have no VOD.

        Why test this? No streaming = no recording to play back.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="No Streaming Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform=None,
            stream_url=None,
            vod_url=None,
        )
        db.session.add(session)
        db.session.commit()

        assert session.has_vod is False

    def test_has_vod_vimeo_without_stream_url_is_false(self, db, event_factory):
        """Test that Vimeo platform without stream_url has no VOD.

        Why test this? Platform set but no URL = no content to play.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Vimeo No URL Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            streaming_platform='VIMEO',
            stream_url=None,  # No URL
            vod_url=None,
        )
        db.session.add(session)
        db.session.commit()

        assert session.has_vod is False
