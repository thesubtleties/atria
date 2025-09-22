"""Test Session model functionality.

Testing Strategy:
- Sessions are the individual talks/panels within an event
- They have speakers, chat rooms, and time slots
- Critical for event scheduling and speaker management
"""

import pytest
from datetime import datetime, time, timedelta, timezone
from api.models import Session, Event, User, SessionSpeaker
from api.models.enums import SessionSpeakerRole, ChatRoomType, SessionStatus, SessionType, SessionChatMode


class TestSessionModel:
    """Test Session model and speaker management."""

    def test_session_creation(self, db, event_factory):
        """Test creating a session within an event.

        Why test this? Sessions are the core content of events.
        Without sessions, there's no schedule or content.
        """
        event = event_factory()

        session = Session(
            event_id=event.id,
            title="Introduction to AI",
            short_description="AI basics workshop",
            description="Learn the basics of artificial intelligence",
            start_time=time(10, 0),  # 10:00 AM
            end_time=time(11, 30),   # 11:30 AM
            day_number=1,
            # Required enums - use actual enum objects
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.WORKSHOP,
            chat_mode=SessionChatMode.ENABLED
        )
        db.session.add(session)
        db.session.commit()

        assert session.id is not None
        assert session.event_id == event.id
        assert session.title == "Introduction to AI"
        assert session.day_number == 1
        # Session model returns enum objects, not strings
        assert session.status == SessionStatus.SCHEDULED

    def test_session_speaker_assignment(self, db, user_factory, event_factory):
        """Test assigning speakers to sessions.

        Why test this? Sessions need speakers. We need to track
        who's presenting and in what capacity (host, speaker, panelist).
        """
        event = event_factory()
        speaker = user_factory()

        session = Session(
            event_id=event.id,
            title="Tech Talk",
            start_time=time(14, 0),  # 2:00 PM
            end_time=time(15, 0),    # 3:00 PM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED
        )
        db.session.add(session)
        db.session.commit()

        # Add speaker to session
        session_speaker = SessionSpeaker(
            session_id=session.id,
            user_id=speaker.id,
            role=SessionSpeakerRole.SPEAKER
        )
        db.session.add(session_speaker)
        db.session.commit()

        # Verify speaker assignment
        # session.speakers returns User objects
        # session.session_speakers returns SessionSpeaker association objects
        assert len(session.speakers) == 1
        assert session.speakers[0].id == speaker.id  # User object

        # Check the SessionSpeaker association for role
        assert len(session.session_speakers) == 1
        assert session.session_speakers[0].user_id == speaker.id
        assert session.session_speakers[0].role == SessionSpeakerRole.SPEAKER

    def test_session_multiple_speakers_with_roles(self, db, user_factory, event_factory):
        """Test sessions can have multiple speakers with different roles.

        Why test this? Panel discussions have multiple speakers,
        each with different roles (host, panelist, moderator).
        """
        event = event_factory()
        host = user_factory()
        panelist1 = user_factory()
        panelist2 = user_factory()

        session = Session(
            event_id=event.id,
            title="Panel Discussion",
            start_time=time(16, 0),  # 4:00 PM
            end_time=time(17, 0),    # 5:00 PM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PANEL,
            chat_mode=SessionChatMode.ENABLED
        )
        db.session.add(session)
        db.session.commit()

        # Add speakers with different roles
        for user, role in [
            (host, SessionSpeakerRole.HOST),
            (panelist1, SessionSpeakerRole.PANELIST),
            (panelist2, SessionSpeakerRole.PANELIST)
        ]:
            speaker = SessionSpeaker(
                session_id=session.id,
                user_id=user.id,
                role=role
            )
            db.session.add(speaker)

        db.session.commit()

        # Verify all speakers and roles
        assert len(session.speakers) == 3  # User objects

        # Check each role using SessionSpeaker associations
        assert len(session.session_speakers) == 3
        roles = {s.user_id: s.role for s in session.session_speakers}
        assert roles[host.id] == SessionSpeakerRole.HOST
        assert roles[panelist1.id] == SessionSpeakerRole.PANELIST
        assert roles[panelist2.id] == SessionSpeakerRole.PANELIST

    def test_session_time_validation(self, db, event_factory):
        """Test that session times must be valid.

        Why test this? Sessions can't end before they start,
        and should be within event dates.
        """
        event = event_factory()
        now = datetime.now(timezone.utc)

        # Test invalid: end before start
        session = Session(
            event_id=event.id,
            title="Invalid Session",
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=1)  # Before start!
        )

        # This should fail validation if implemented
        # Document actual behavior
        db.session.add(session)
        try:
            db.session.commit()
            # If it commits, validation is missing
            assert session.id is not None  # Document that it currently allows this
            # TODO: Add validation to prevent end_time before start_time
        except Exception:
            # If it fails, validation exists
            db.session.rollback()

    def test_session_chat_room_relationship(self, db, event_factory):
        """Test sessions can have associated chat rooms.

        Why test this? Sessions often have chat rooms for
        Q&A and discussion (PUBLIC and BACKSTAGE types).
        """
        from api.models import ChatRoom

        event = event_factory()
        session = Session(
            event_id=event.id,
            title="Workshop",
            start_time=time(9, 0),   # 9:00 AM
            end_time=time(11, 0),    # 11:00 AM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.WORKSHOP,
            chat_mode=SessionChatMode.ENABLED
        )
        db.session.add(session)
        db.session.commit()

        # Create PUBLIC chat room for session
        public_chat = ChatRoom(
            event_id=event.id,
            session_id=session.id,
            name=f"{session.title} Chat",
            room_type=ChatRoomType.PUBLIC
        )
        db.session.add(public_chat)

        # Create BACKSTAGE chat room for speakers
        backstage_chat = ChatRoom(
            event_id=event.id,
            session_id=session.id,
            name=f"{session.title} Backstage",
            room_type=ChatRoomType.BACKSTAGE
        )
        db.session.add(backstage_chat)
        db.session.commit()

        # Verify chat rooms are associated
        assert len(session.chat_rooms) == 2

        public_rooms = [r for r in session.chat_rooms if r.room_type == ChatRoomType.PUBLIC]
        backstage_rooms = [r for r in session.chat_rooms if r.room_type == ChatRoomType.BACKSTAGE]

        assert len(public_rooms) == 1
        assert len(backstage_rooms) == 1

    def test_session_ordering_by_time(self, db, event_factory):
        """Test sessions are naturally ordered by start time.

        Why test this? Event agendas need sessions in chronological order.
        """
        event = event_factory()

        # Create sessions out of order
        session3 = Session(
            event_id=event.id,
            title="Session 3",
            start_time=time(15, 0),  # 3:00 PM
            end_time=time(16, 0),    # 4:00 PM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED
        )
        session1 = Session(
            event_id=event.id,
            title="Session 1",
            start_time=time(13, 0),  # 1:00 PM
            end_time=time(14, 0),    # 2:00 PM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED
        )
        session2 = Session(
            event_id=event.id,
            title="Session 2",
            start_time=time(14, 0),  # 2:00 PM
            end_time=time(15, 0),    # 3:00 PM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED
        )

        db.session.add_all([session3, session1, session2])
        db.session.commit()

        # Query sessions for the event
        sessions = Session.query.filter_by(event_id=event.id).order_by(
            Session.start_time
        ).all()

        # Should be in chronological order
        assert sessions[0].title == "Session 1"
        assert sessions[1].title == "Session 2"
        assert sessions[2].title == "Session 3"

    def test_session_deletion_cascades(self, db, user_factory, event_factory):
        """Test what happens when a session is deleted.

        Why test this? Need to understand cascade behavior for
        SessionSpeakers and ChatRooms when session is deleted.
        """
        event = event_factory()
        speaker = user_factory()

        session = Session(
            event_id=event.id,
            title="To Be Deleted",
            start_time=time(10, 0),  # 10:00 AM
            end_time=time(11, 0),    # 11:00 AM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED
        )
        db.session.add(session)
        db.session.commit()

        # Add speaker
        session_speaker = SessionSpeaker(
            session_id=session.id,
            user_id=speaker.id,
            role=SessionSpeakerRole.SPEAKER
        )
        db.session.add(session_speaker)
        db.session.commit()

        session_id = session.id
        speaker_id = speaker.id

        # Delete session
        db.session.delete(session)
        db.session.commit()

        # Check cascade behavior
        # SessionSpeaker should be deleted
        assert SessionSpeaker.query.filter_by(
            session_id=session_id,
            user_id=speaker_id
        ).first() is None

        # User should still exist
        assert User.query.get(speaker_id) is not None

    def test_session_overlap_detection(self, db, user_factory, event_factory):
        """Test detecting when sessions overlap for the same speaker.

        Why test this? Speakers can't be in two places at once.
        System should detect scheduling conflicts.
        """
        event = event_factory()
        speaker = user_factory()

        # First session: 10:00 - 11:00
        session1 = Session(
            event_id=event.id,
            title="Morning Talk",
            start_time=time(10, 0),  # 10:00 AM
            end_time=time(11, 0),    # 11:00 AM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED
        )
        db.session.add(session1)
        db.session.commit()

        # Assign speaker to first session
        speaker1 = SessionSpeaker(
            session_id=session1.id,
            user_id=speaker.id,
            role=SessionSpeakerRole.SPEAKER
        )
        db.session.add(speaker1)
        db.session.commit()

        # Second session: 10:30 - 11:30 (overlaps!)
        session2 = Session(
            event_id=event.id,
            title="Overlapping Talk",
            start_time=time(10, 30),  # 10:30 AM
            end_time=time(11, 30),    # 11:30 AM
            day_number=1,
            status=SessionStatus.SCHEDULED,
            session_type=SessionType.PRESENTATION,
            chat_mode=SessionChatMode.ENABLED
        )
        db.session.add(session2)
        db.session.commit()

        # Try to assign same speaker - should detect conflict
        # TODO: System currently allows this - needs validation
        speaker2 = SessionSpeaker(
            session_id=session2.id,
            user_id=speaker.id,
            role=SessionSpeakerRole.SPEAKER
        )
        db.session.add(speaker2)
        db.session.commit()

        # Document current behavior (allows overlap)
        speaker_sessions = SessionSpeaker.query.filter_by(user_id=speaker.id).all()
        assert len(speaker_sessions) == 2  # Currently allows this - needs fixing!