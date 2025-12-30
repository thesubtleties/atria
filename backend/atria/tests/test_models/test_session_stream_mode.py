"""Test Session stream mode computed properties.

Testing Strategy:
- Stream mode controls whether session is NONE (no video), LIVE, or VOD
- Backward compatibility: NULL stream_mode infers from streaming_platform
- show_video is master toggle, show_recording controls post-live VOD
- current_video_state provides single source of truth for frontend
"""

import pytest
from datetime import datetime, time, timedelta, timezone
from unittest.mock import patch
from api.models import Session, Event
from api.models.enums import SessionStatus, SessionType, SessionChatMode


class TestEffectiveStreamMode:
    """Test effective_stream_mode backward compatibility logic."""

    def test_explicit_live_mode_returns_live(self, db, event_factory):
        """Test that explicit 'LIVE' stream_mode returns 'LIVE'.

        Why test this? Explicit mode should be honored directly.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Explicit LIVE Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
        )
        db.session.add(session)
        db.session.commit()

        assert session.effective_stream_mode == 'LIVE'

    def test_explicit_vod_mode_returns_vod(self, db, event_factory):
        """Test that explicit 'VOD' stream_mode returns 'VOD'.

        Why test this? VOD sessions should be clearly identified.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Explicit VOD Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='VOD',
        )
        db.session.add(session)
        db.session.commit()

        assert session.effective_stream_mode == 'VOD'

    def test_explicit_none_mode_returns_none(self, db, event_factory):
        """Test that explicit 'NONE' stream_mode returns 'NONE'.

        Why test this? In-person/chat-only sessions should be identifiable.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Explicit NONE Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='NONE',
        )
        db.session.add(session)
        db.session.commit()

        assert session.effective_stream_mode == 'NONE'

    def test_null_mode_with_streaming_platform_infers_live(self, db, event_factory):
        """Test backward compat: NULL mode + streaming_platform = LIVE.

        Why test this? Existing sessions created before stream_mode was added
        should continue to work as live sessions if they have a platform set.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Backward Compat LIVE Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode=None,  # NULL
            streaming_platform='VIMEO',
            stream_url='123456789',
        )
        db.session.add(session)
        db.session.commit()

        assert session.effective_stream_mode == 'LIVE'

    def test_null_mode_without_streaming_platform_infers_none(self, db, event_factory):
        """Test backward compat: NULL mode + no platform = NONE.

        Why test this? Existing sessions without streaming should be
        treated as no-video sessions.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Backward Compat NONE Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode=None,
            streaming_platform=None,
        )
        db.session.add(session)
        db.session.commit()

        assert session.effective_stream_mode == 'NONE'


class TestStreamModeHelperProperties:
    """Test is_vod_session, is_live_session, is_no_video_session helpers."""

    def test_is_vod_session_true_for_vod_mode(self, db, event_factory):
        """Test is_vod_session returns True for VOD mode."""
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="VOD Session Check",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='VOD',
        )
        db.session.add(session)
        db.session.commit()

        assert session.is_vod_session is True
        assert session.is_live_session is False
        assert session.is_no_video_session is False

    def test_is_live_session_true_for_live_mode(self, db, event_factory):
        """Test is_live_session returns True for LIVE mode."""
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="LIVE Session Check",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
        )
        db.session.add(session)
        db.session.commit()

        assert session.is_live_session is True
        assert session.is_vod_session is False
        assert session.is_no_video_session is False

    def test_is_no_video_session_true_for_none_mode(self, db, event_factory):
        """Test is_no_video_session returns True for NONE mode."""
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="NONE Session Check",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='NONE',
        )
        db.session.add(session)
        db.session.commit()

        assert session.is_no_video_session is True
        assert session.is_live_session is False
        assert session.is_vod_session is False


class TestShouldShowVideo:
    """Test should_show_video master toggle logic."""

    def test_show_video_false_hides_video(self, db, event_factory):
        """Test that show_video=False hides video regardless of other settings.

        Why test this? Master toggle should override everything.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Hidden Video Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=False,  # Master toggle OFF
        )
        db.session.add(session)
        db.session.commit()

        assert session.should_show_video is False

    def test_no_video_session_returns_false(self, db, event_factory):
        """Test that NONE mode sessions don't show video.

        Why test this? No video configured = nothing to show.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="No Video Mode Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='NONE',
            show_video=True,
        )
        db.session.add(session)
        db.session.commit()

        assert session.should_show_video is False

    def test_live_session_with_stream_url_shows_video(self, db, event_factory):
        """Test that LIVE session with stream_url shows video."""
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Live With URL Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=True,
        )
        db.session.add(session)
        db.session.commit()

        assert session.should_show_video is True

    def test_session_with_only_vod_url_shows_video(self, db, event_factory):
        """Test that session with only vod_url still shows video.

        Why test this? A session might have recording but no live stream.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="VOD URL Only Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform=None,
            stream_url=None,
            vod_url='https://youtube.com/watch?v=abc123',
            show_video=True,
        )
        db.session.add(session)
        db.session.commit()

        assert session.should_show_video is True


class TestShouldShowRecording:
    """Test should_show_recording logic for post-live VOD."""

    def test_show_recording_false_hides_recording(self, db, event_factory):
        """Test that show_recording=False hides recording.

        Why test this? Organizers may want to disable recording display.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Recording Hidden Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=True,
            show_recording=False,  # Recording disabled
        )
        db.session.add(session)
        db.session.commit()

        # Even if session is past end and has VOD, recording is hidden
        with patch.object(Session, 'is_past_end_time', True):
            assert session.should_show_recording is False

    def test_vod_session_never_shows_recording(self, db, event_factory):
        """Test that VOD sessions don't have separate 'recording'.

        Why test this? VOD IS the content, there's no live→recording transition.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="VOD No Recording Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='VOD',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=True,
            show_recording=True,
        )
        db.session.add(session)
        db.session.commit()

        with patch.object(Session, 'is_past_end_time', True):
            assert session.should_show_recording is False

    def test_live_session_shows_recording_after_end(self, db, event_factory):
        """Test that LIVE session shows recording after end_time.

        Why test this? This is the main use case for show_recording.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Recording After Live Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=True,
            show_recording=True,
        )
        db.session.add(session)
        db.session.commit()

        with patch.object(Session, 'is_past_end_time', True):
            assert session.should_show_recording is True


class TestCurrentVideoState:
    """Test current_video_state which provides single source of truth for frontend."""

    def test_none_mode_returns_none_state(self, db, event_factory):
        """Test that NONE mode returns 'none' state."""
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="None State Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='NONE',
        )
        db.session.add(session)
        db.session.commit()

        assert session.current_video_state == 'none'

    def test_hidden_video_returns_hidden_state(self, db, event_factory):
        """Test that show_video=False returns 'hidden' state."""
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Hidden State Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=False,
        )
        db.session.add(session)
        db.session.commit()

        assert session.current_video_state == 'hidden'

    def test_vod_session_before_start_returns_pre(self, db, event_factory):
        """Test that VOD session before start_time returns 'pre'.

        Why test this? VOD becomes available at session start time.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="VOD Pre State Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='VOD',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=True,
        )
        db.session.add(session)
        db.session.commit()

        with patch.object(Session, 'is_past_start_time', False):
            assert session.current_video_state == 'pre'

    def test_vod_session_after_start_returns_vod(self, db, event_factory):
        """Test that VOD session after start_time returns 'vod'.

        Why test this? VOD is available (evergreen) after session starts.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="VOD Available State Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='VOD',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=True,
        )
        db.session.add(session)
        db.session.commit()

        with patch.object(Session, 'is_past_start_time', True):
            assert session.current_video_state == 'vod'

    def test_live_session_in_window_returns_live(self, db, event_factory):
        """Test that LIVE session during window returns 'live'."""
        event = event_factory()
        event.session_visibility_minutes = None  # Always on
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Live State Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=True,
        )
        db.session.add(session)
        db.session.commit()

        # Mock: window is open, not past end
        with patch.object(Session, 'is_window_open', True):
            with patch.object(Session, 'is_past_end_time', False):
                assert session.current_video_state == 'live'

    def test_live_session_after_end_with_recording_returns_recording(self, db, event_factory):
        """Test that LIVE session after end with VOD returns 'recording'."""
        event = event_factory()
        event.session_visibility_minutes = None
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Recording State Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=True,
            show_recording=True,
        )
        db.session.add(session)
        db.session.commit()

        # Mock: window closed, past end, has VOD (Vimeo auto-detects)
        with patch.object(Session, 'is_window_open', False):
            with patch.object(Session, 'is_past_end_time', True):
                assert session.current_video_state == 'recording'

    def test_live_session_after_end_without_recording_returns_ended(self, db, event_factory):
        """Test that LIVE session after end without VOD returns 'ended'.

        Why test this? Session is over and no recording available.
        """
        event = event_factory()
        event.session_visibility_minutes = None
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Ended State Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='ZOOM',  # Zoom has no auto-VOD
            zoom_meeting_id='123456789',
            show_video=True,
            show_recording=True,
        )
        db.session.add(session)
        db.session.commit()

        with patch.object(Session, 'is_window_open', False):
            with patch.object(Session, 'is_past_end_time', True):
                assert session.current_video_state == 'ended'

    def test_live_session_before_window_returns_pre(self, db, event_factory):
        """Test that LIVE session before visibility window returns 'pre'."""
        event = event_factory()
        event.session_visibility_minutes = 10  # 10 minute buffer
        db.session.commit()

        session = Session(
            event_id=event.id,
            title="Pre Window State Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=True,
        )
        db.session.add(session)
        db.session.commit()

        # Mock: window not open, not past end
        with patch.object(Session, 'is_window_open', False):
            with patch.object(Session, 'is_past_end_time', False):
                assert session.current_video_state == 'pre'


class TestShowRecordingWithShowVideoToggle:
    """Test interaction between show_video and show_recording toggles."""

    def test_show_video_false_overrides_show_recording(self, db, event_factory):
        """Test that show_video=False means show_recording is also False.

        Why test this? Master toggle should control everything.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Master Override Test",
            start_time=time(10, 0),
            end_time=time(11, 0),
            day_number=1,
            status=SessionStatus.COMPLETED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED,
            stream_mode='LIVE',
            streaming_platform='VIMEO',
            stream_url='123456789',
            show_video=False,  # Master toggle OFF
            show_recording=True,  # Recording enabled, but shouldn't matter
        )
        db.session.add(session)
        db.session.commit()

        with patch.object(Session, 'is_past_end_time', True):
            assert session.should_show_recording is False
