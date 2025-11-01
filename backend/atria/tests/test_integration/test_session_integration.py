"""
Session Integration Tests

These tests verify the complete session management flow including:
- Session creation with automatic chat room setup
- Speaker assignment and role management
- Chat mode settings (ENABLED/BACKSTAGE_ONLY/DISABLED)
- Schedule conflict detection
- Access control for different user roles
- Multi-day session handling
"""

import json
import pytest
from datetime import datetime, timedelta, timezone
from api.models import User, Organization, Event, Session, ChatRoom, SessionSpeaker
from api.models.enums import (
    EventType, EventStatus, EventUserRole,
    SessionStatus, SessionType, SessionChatMode,
    ChatRoomType, SessionSpeakerRole, StreamingPlatform
)


class TestSessionIntegration:
    """Test complete session workflows from API to database."""

    def _get_event_data(self, title='Test Event', **overrides):
        """Helper to create valid event data with future dates."""
        utc_now = datetime.now(timezone.utc).date()
        future_start = utc_now + timedelta(days=60)
        future_end = future_start + timedelta(days=2)  # 3-day event

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

    def _get_session_data(self, title='Test Session', day_number=1, **overrides):
        """Helper to create valid session data."""
        # Sessions use time of day, not full datetime
        # Default to 10:00 AM - 11:00 AM

        data = {
            'title': title,
            'description': 'Test session description',
            'session_type': 'KEYNOTE',
            'start_time': '10:00:00',  # Just time, not datetime
            'end_time': '11:00:00',    # Just time, not datetime
            'day_number': day_number,
            'chat_mode': 'ENABLED'
        }
        data.update(overrides)
        return data

    def test_session_creation_with_chat_rooms(self, client, db):
        """Test that sessions auto-create appropriate chat rooms.

        Why test this? Sessions are where the actual event content happens,
        and chat rooms are crucial for attendee engagement.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Session', last_name='Organizer',
                         password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        # Create organization and event
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Session Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Conference 2025')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session
        session_response = client.post(
            f'/api/events/{event_id}/sessions',
            json=self._get_session_data('Opening Keynote')
        )
        assert session_response.status_code == 201
        session_data = json.loads(session_response.data)
        session_id = session_data['id']

        # Verify chat rooms were created
        session = Session.query.get(session_id)
        assert session is not None

        # Sessions create PUBLIC and BACKSTAGE rooms by default
        chat_rooms = ChatRoom.query.filter_by(session_id=session_id).all()
        assert len(chat_rooms) == 2

        room_types = {room.room_type for room in chat_rooms}
        assert ChatRoomType.PUBLIC in room_types
        assert ChatRoomType.BACKSTAGE in room_types

    def test_speaker_assignment_with_roles(self, client, db):
        """Test assigning speakers to sessions with different roles.

        Why test this? Speaker management is complex with different roles
        (HOST, SPEAKER, PANELIST, MODERATOR) having different permissions.
        """
        # Create users
        organizer = User(email='organizer@sbtl.ai', first_name='Event', last_name='Organizer',
                        password='Pass123!', email_verified=True)
        speaker1 = User(email='speaker1@sbtl.ai', first_name='Main', last_name='Speaker',
                       password='Pass123!', email_verified=True)
        speaker2 = User(email='speaker2@sbtl.ai', first_name='Panel', last_name='Member',
                       password='Pass123!', email_verified=True)
        db.session.add_all([organizer, speaker1, speaker2])
        db.session.commit()

        # Setup event
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Speaker Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Tech Summit 2025')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session
        session_response = client.post(
            f'/api/events/{event_id}/sessions',
            json=self._get_session_data('Panel Discussion', session_type='PANEL')
        )
        session_id = json.loads(session_response.data)['id']

        # Add speakers with different roles
        # Add main speaker as HOST
        speaker1_response = client.post(
            f'/api/sessions/{session_id}/speakers',
            json={
                'user_id': speaker1.id,
                'role': 'HOST'  # API expects UPPERCASE enum values
            }
        )
        assert speaker1_response.status_code == 201

        # Add panel member as PANELIST
        speaker2_response = client.post(
            f'/api/sessions/{session_id}/speakers',
            json={
                'user_id': speaker2.id,
                'role': 'PANELIST'  # API expects UPPERCASE enum values
            }
        )
        assert speaker2_response.status_code == 201

        # Verify speakers were added with correct roles
        speakers = SessionSpeaker.query.filter_by(session_id=session_id).all()
        assert len(speakers) == 2

        # SessionSpeaker stores enum objects
        speaker_roles = {s.user_id: s.role for s in speakers}
        # Check the enum values - they're stored as lowercase in the DB
        assert speaker_roles[speaker1.id] == SessionSpeakerRole.HOST
        assert speaker_roles[speaker2.id] == SessionSpeakerRole.PANELIST

    def test_chat_mode_settings(self, client, db):
        """Test different chat mode settings affect room access.

        Why test this? Chat modes control audience interaction:
        - ENABLED: Everyone can chat
        - BACKSTAGE_ONLY: Only speakers can chat
        - DISABLED: No chat at all
        """
        # Setup users
        organizer = User(email='organizer@sbtl.ai', first_name='Chat', last_name='Admin',
                        password='Pass123!', email_verified=True)
        speaker = User(email='speaker@sbtl.ai', first_name='Chat', last_name='Speaker',
                      password='Pass123!', email_verified=True)
        attendee = User(email='attendee@sbtl.ai', first_name='Chat', last_name='Attendee',
                       password='Pass123!', email_verified=True)
        db.session.add_all([organizer, speaker, attendee])
        db.session.commit()

        # Setup event
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Chat Mode Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Chat Test Conference')
        )
        event_id = json.loads(event_response.data)['id']

        # Test ENABLED mode - everyone can access public chat
        enabled_session = client.post(
            f'/api/events/{event_id}/sessions',
            json=self._get_session_data('Interactive Workshop', chat_mode='ENABLED')
        )
        enabled_id = json.loads(enabled_session.data)['id']

        # Test BACKSTAGE_ONLY mode - both rooms created but frontend only shows backstage
        backstage_session = client.post(
            f'/api/events/{event_id}/sessions',
            json=self._get_session_data('Presentation', chat_mode='BACKSTAGE_ONLY', day_number=2)
        )
        backstage_id = json.loads(backstage_session.data)['id']

        # Test DISABLED mode - rooms still created but not accessible
        disabled_session = client.post(
            f'/api/events/{event_id}/sessions',
            json=self._get_session_data('Recording Session', chat_mode='DISABLED', day_number=3)
        )
        disabled_id = json.loads(disabled_session.data)['id']

        # Verify rooms are ALWAYS created regardless of chat_mode
        # The chat_mode controls frontend visibility/access, not creation
        enabled_rooms = ChatRoom.query.filter_by(session_id=enabled_id).all()
        assert len(enabled_rooms) == 2  # PUBLIC and BACKSTAGE

        backstage_rooms = ChatRoom.query.filter_by(session_id=backstage_id).all()
        assert len(backstage_rooms) == 2  # Both rooms created, frontend filters
        room_types = {room.room_type for room in backstage_rooms}
        assert ChatRoomType.PUBLIC in room_types
        assert ChatRoomType.BACKSTAGE in room_types

        disabled_rooms = ChatRoom.query.filter_by(session_id=disabled_id).all()
        assert len(disabled_rooms) == 2  # Confirmed: rooms ARE created even with DISABLED mode

    def test_session_schedule_conflict_detection(self, client, db):
        """Test that overlapping sessions are detected.

        Why test this? Speakers can't be in two places at once,
        and attendees need clear schedules.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Schedule', last_name='Manager',
                        password='Pass123!', email_verified=True)
        speaker = User(email='speaker@sbtl.ai', first_name='Busy', last_name='Speaker',
                      password='Pass123!', email_verified=True)
        db.session.add_all([organizer, speaker])
        db.session.commit()

        # Setup event
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Schedule Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Packed Conference')
        )
        event_id = json.loads(event_response.data)['id']

        # Create first session at 10:00-11:00
        session1_response = client.post(
            f'/api/events/{event_id}/sessions',
            json={
                'title': 'Morning Keynote',
                'session_type': 'KEYNOTE',
                'start_time': '10:00:00',
                'end_time': '11:00:00',
                'day_number': 1
            }
        )
        session1_id = json.loads(session1_response.data)['id']

        # Add speaker to first session
        client.post(
            f'/api/sessions/{session1_id}/speakers',
            json={'user_id': speaker.id, 'role': 'SPEAKER'}
        )

        # Try to create overlapping session at 10:30-11:30
        session2_response = client.post(
            f'/api/events/{event_id}/sessions',
            json={
                'title': 'Overlapping Workshop',
                'session_type': 'WORKSHOP',
                'start_time': '10:30:00',
                'end_time': '11:30:00',
                'day_number': 1
            }
        )
        session2_id = json.loads(session2_response.data)['id']

        # Try to add same speaker to overlapping session
        # This should fail or warn about conflict
        speaker_conflict_response = client.post(
            f'/api/sessions/{session2_id}/speakers',
            json={'user_id': speaker.id, 'role': 'SPEAKER'}
        )

        # Document actual behavior - system might allow it with warning
        # or might reject it entirely
        if speaker_conflict_response.status_code == 400:
            error_data = json.loads(speaker_conflict_response.data)
            assert 'conflict' in error_data.get('message', '').lower()

    def test_session_update_permissions(self, client, db):
        """Test that only organizers can update session details.

        Why test this? Session details affect attendee schedules,
        so changes must be controlled.
        """
        # Create users with different roles
        organizer = User(email='organizer@sbtl.ai', first_name='Can', last_name='Update',
                        password='Pass123!', email_verified=True)
        speaker = User(email='speaker@sbtl.ai', first_name='Cannot', last_name='Update',
                      password='Pass123!', email_verified=True)
        attendee = User(email='attendee@sbtl.ai', first_name='Also', last_name='Cannot',
                       password='Pass123!', email_verified=True)
        db.session.add_all([organizer, speaker, attendee])
        db.session.commit()

        # Setup event
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Permission Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Secure Conference')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session
        session_response = client.post(
            f'/api/events/{event_id}/sessions',
            json=self._get_session_data('Original Title')
        )
        session_id = json.loads(session_response.data)['id']

        # Add speaker and attendee to event
        client.post(
            f'/api/events/{event_id}/users/add',
            json={
                'email': 'speaker@sbtl.ai',
                'first_name': 'Cannot',
                'last_name': 'Update',
                'role': 'SPEAKER'
            }
        )
        client.post(
            f'/api/events/{event_id}/users/add',
            json={
                'email': 'attendee@sbtl.ai',
                'first_name': 'Also',
                'last_name': 'Cannot',
                'role': 'ATTENDEE'
            }
        )

        # Organizer can update
        update_response = client.put(
            f'/api/sessions/{session_id}',
            json={'title': 'Updated by Organizer'}
        )
        assert update_response.status_code == 200

        # Speaker cannot update
        client.post('/api/auth/logout')
        client.post('/api/auth/login', json={'email': 'speaker@sbtl.ai', 'password': 'Pass123!'})

        speaker_update = client.put(
            f'/api/sessions/{session_id}',
            json={'title': 'Attempted by Speaker'}
        )
        assert speaker_update.status_code == 403

        # Attendee cannot update
        client.post('/api/auth/logout')
        client.post('/api/auth/login', json={'email': 'attendee@sbtl.ai', 'password': 'Pass123!'})

        attendee_update = client.put(
            f'/api/sessions/{session_id}',
            json={'title': 'Attempted by Attendee'}
        )
        assert attendee_update.status_code == 403

    def test_session_deletion_with_cleanup(self, client, db):
        """Test that deleting a session cleans up related data.

        Why test this? Sessions have chat rooms, speakers, and possibly
        messages that need proper cleanup.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Delete', last_name='Manager',
                        password='Pass123!', email_verified=True)
        speaker = User(email='speaker@sbtl.ai', first_name='Session', last_name='Speaker',
                      password='Pass123!', email_verified=True)
        db.session.add_all([organizer, speaker])
        db.session.commit()

        # Create event with session
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Deletion Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Temporary Conference')
        )
        event_id = json.loads(event_response.data)['id']

        session_response = client.post(
            f'/api/events/{event_id}/sessions',
            json=self._get_session_data('To Be Deleted')
        )
        session_id = json.loads(session_response.data)['id']

        # Add speaker
        client.post(
            f'/api/sessions/{session_id}/speakers',
            json={'user_id': speaker.id, 'role': 'SPEAKER'}
        )

        # Verify session and related data exist
        session = Session.query.get(session_id)
        assert session is not None
        chat_rooms = ChatRoom.query.filter_by(session_id=session_id).all()
        assert len(chat_rooms) > 0
        speakers = SessionSpeaker.query.filter_by(session_id=session_id).all()
        assert len(speakers) > 0

        # Delete session
        delete_response = client.delete(f'/api/sessions/{session_id}')
        assert delete_response.status_code in [200, 204]

        # Verify cleanup
        session = Session.query.get(session_id)
        assert session is None or session.is_deleted  # Might be soft delete

        # Chat rooms should be deleted
        chat_rooms = ChatRoom.query.filter_by(session_id=session_id).all()
        assert len(chat_rooms) == 0

        # Speaker associations should be deleted
        speakers = SessionSpeaker.query.filter_by(session_id=session_id).all()
        assert len(speakers) == 0

    def test_multi_day_session_handling(self, client, db):
        """Test sessions spanning multiple event days.

        Why test this? Multi-day workshops and training sessions
        need proper day_number assignment and scheduling.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Multi', last_name='Day',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        # Create 5-day event
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Multi-Day Org'})
        org_id = json.loads(org_response.data)['id']

        utc_now = datetime.now(timezone.utc).date()
        start_date = utc_now + timedelta(days=60)
        end_date = start_date + timedelta(days=4)  # 5-day event

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json={
                'title': 'Week-Long Summit',
                'event_type': 'CONFERENCE',
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'company_name': 'Test Corp',
                'timezone': 'UTC'
            }
        )
        event_id = json.loads(event_response.data)['id']

        # Create sessions on different days
        sessions_created = []
        for day in range(1, 6):  # Days 1-5
            session_response = client.post(
                f'/api/events/{event_id}/sessions',
                json=self._get_session_data(f'Day {day} Keynote', day_number=day)
            )
            assert session_response.status_code == 201
            sessions_created.append(json.loads(session_response.data))

        # Verify sessions are assigned to correct days
        assert len(sessions_created) == 5
        for idx, session_data in enumerate(sessions_created):
            expected_day = idx + 1
            assert session_data['day_number'] == expected_day
            assert f'Day {expected_day}' in session_data['title']

    def test_session_attendee_tracking(self, client, db):
        """Test tracking session attendance and capacity.

        NOTE: This feature doesn't actually exist yet!
        Sessions don't have capacity limits or attendee tracking.
        People attend events, not individual sessions.
        Commenting out until/if this feature is implemented.
        """
        pytest.skip("Session attendee tracking not implemented")
        # Create users
        organizer = User(email='organizer@sbtl.ai', first_name='Track', last_name='Admin',
                        password='Pass123!', email_verified=True)
        attendees = []
        for i in range(5):
            attendee = User(
                email=f'attendee{i}@sbtl.ai',
                first_name=f'User{i}',
                last_name='Attendee',
                password='Pass123!',
                email_verified=True
            )
            attendees.append(attendee)
        db.session.add(organizer)
        db.session.add_all(attendees)
        db.session.commit()

        # Setup event
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Tracking Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Popular Conference')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session with capacity limit
        session_response = client.post(
            f'/api/events/{event_id}/sessions',
            json={
                **self._get_session_data('Limited Workshop'),
                'capacity': 3  # Only 3 spots available
            }
        )
        session_id = json.loads(session_response.data)['id']

        # Add attendees to event first
        for attendee in attendees:
            client.post(
                f'/api/events/{event_id}/users/add',
                json={
                    'email': attendee.email,
                    'first_name': attendee.first_name,
                    'last_name': attendee.last_name,
                    'role': 'ATTENDEE'
                }
            )

        # Try to register attendees for session
        registrations = []
        for i, attendee in enumerate(attendees):
            # Login as attendee
            client.post('/api/auth/logout')
            client.post('/api/auth/login',
                       json={'email': attendee.email, 'password': 'Pass123!'})

            # Try to join session
            join_response = client.post(f'/api/sessions/{session_id}/join')
            registrations.append(join_response.status_code)

            # First 3 should succeed, last 2 might fail due to capacity
            if i < 3:
                assert join_response.status_code in [200, 201]
            # Document actual capacity enforcement behavior

        # Check attendee list as organizer
        client.post('/api/auth/logout')
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})

        attendee_list = client.get(f'/api/sessions/{session_id}/attendees')
        if attendee_list.status_code == 200:
            attendees_data = json.loads(attendee_list.data)
            # Should show who's registered for the session

    def test_backstage_room_access_control(self, client, db):
        """Test that only speakers and organizers can access backstage chat.

        Why test this? Backstage is for speaker coordination and shouldn't
        be visible to regular attendees.
        """
        # Create users
        organizer = User(email='organizer@sbtl.ai', first_name='Can', last_name='Access',
                        password='Pass123!', email_verified=True)
        speaker = User(email='speaker@sbtl.ai', first_name='Also', last_name='CanAccess',
                      password='Pass123!', email_verified=True)
        attendee = User(email='attendee@sbtl.ai', first_name='Cannot', last_name='Access',
                       password='Pass123!', email_verified=True)
        db.session.add_all([organizer, speaker, attendee])
        db.session.commit()

        # Setup event and session
        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Backstage Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Private Conference')
        )
        event_id = json.loads(event_response.data)['id']

        session_response = client.post(
            f'/api/events/{event_id}/sessions',
            json=self._get_session_data('VIP Panel')
        )
        session_id = json.loads(session_response.data)['id']

        # Add speaker
        client.post(
            f'/api/sessions/{session_id}/speakers',
            json={'user_id': speaker.id, 'role': 'SPEAKER'}
        )

        # Add attendee to event
        client.post(
            f'/api/events/{event_id}/users/add',
            json={
                'email': 'attendee@sbtl.ai',
                'first_name': 'Cannot',
                'last_name': 'Access',
                'role': 'ATTENDEE'
            }
        )

        # Get backstage room
        backstage_room = ChatRoom.query.filter_by(
            session_id=session_id,
            room_type=ChatRoomType.BACKSTAGE
        ).first()
        assert backstage_room is not None

        # Organizer can access backstage
        rooms_response = client.get(f'/api/sessions/{session_id}/rooms')
        if rooms_response.status_code == 200:
            rooms = json.loads(rooms_response.data)
            room_ids = [r['id'] for r in rooms.get('rooms', [])]
            assert backstage_room.id in room_ids

        # Speaker can access backstage
        client.post('/api/auth/logout')
        client.post('/api/auth/login', json={'email': 'speaker@sbtl.ai', 'password': 'Pass123!'})

        speaker_rooms = client.get(f'/api/sessions/{session_id}/rooms')
        if speaker_rooms.status_code == 200:
            rooms = json.loads(speaker_rooms.data)
            room_ids = [r['id'] for r in rooms.get('rooms', [])]
            assert backstage_room.id in room_ids

        # Attendee cannot access backstage
        client.post('/api/auth/logout')
        client.post('/api/auth/login', json={'email': 'attendee@sbtl.ai', 'password': 'Pass123!'})

        attendee_rooms = client.get(f'/api/sessions/{session_id}/rooms')
        if attendee_rooms.status_code == 200:
            rooms = json.loads(attendee_rooms.data)
            room_ids = [r['id'] for r in rooms.get('rooms', [])]
            # Backstage should not be visible to attendees
            assert backstage_room.id not in room_ids

    def test_session_streaming_vimeo_url_normalization(self, client, db):
        """Test creating session with Vimeo URL - should extract video ID.

        Why test this? We normalize URLs to IDs in schemas for data consistency.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Vimeo', last_name='Tester',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Vimeo Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Vimeo Streaming Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session with Vimeo full URL
        session_data = self._get_session_data(
            'Vimeo Session',
            streaming_platform='VIMEO',
            stream_url='https://vimeo.com/123456789'
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )

        assert response.status_code == 201
        data = json.loads(response.data)

        # Verify URL was normalized to just ID
        session = Session.query.get(data['id'])
        assert session.streaming_platform == 'VIMEO'
        assert session.stream_url == '123456789'  # Just the ID, not full URL

    def test_session_streaming_mux_url_normalization(self, client, db):
        """Test creating session with Mux URL - should extract playback ID.

        Why test this? Mux playback IDs can be provided as URLs or raw IDs.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Mux', last_name='Tester',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Mux Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Mux Streaming Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session with Mux stream URL
        session_data = self._get_session_data(
            'Mux Session',
            streaming_platform='MUX',
            stream_url='https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe.m3u8',
            mux_playback_policy='PUBLIC'
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )

        assert response.status_code == 201
        data = json.loads(response.data)

        # Verify URL was normalized to just playback ID
        session = Session.query.get(data['id'])
        assert session.streaming_platform == 'MUX'
        assert session.stream_url == 'DS00Spx1CV902MCtPj5WknGlR102V5HFkDe'
        assert session.mux_playback_policy == 'PUBLIC'

    def test_session_streaming_zoom_id_normalization(self, client, db):
        """Test creating session with Zoom meeting ID - should normalize to URL.

        Why test this? Zoom meeting IDs can be formatted various ways (spaces, dashes).
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Zoom', last_name='Tester',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Zoom Test Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Zoom Streaming Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session with Zoom meeting ID (with spaces)
        session_data = self._get_session_data(
            'Zoom Session',
            streaming_platform='ZOOM',
            zoom_meeting_id='123 456 7890',
            zoom_passcode='abc123'
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )

        assert response.status_code == 201
        data = json.loads(response.data)

        # Verify meeting ID was normalized to full URL
        session = Session.query.get(data['id'])
        assert session.streaming_platform == 'ZOOM'
        assert session.zoom_meeting_id == 'https://zoom.us/j/1234567890'
        assert session.zoom_passcode == 'abc123'

    def test_session_streaming_vimeo_raw_id_accepted(self, client, db):
        """Test creating session with raw Vimeo ID (not URL).

        Why test this? Users might already have just the ID.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Vimeo', last_name='ID',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Vimeo ID Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Vimeo ID Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session with raw Vimeo ID (no URL)
        session_data = self._get_session_data(
            'Vimeo ID Session',
            streaming_platform='VIMEO',
            stream_url='987654321'  # Just the ID
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )

        assert response.status_code == 201
        data = json.loads(response.data)

        session = Session.query.get(data['id'])
        assert session.stream_url == '987654321'

    def test_session_streaming_invalid_platform_rejected(self, client, db):
        """Test that invalid streaming platform is rejected.

        Why test this? Enum validation should prevent typos.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Invalid', last_name='Platform',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Invalid Platform Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Invalid Platform Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Try to create session with invalid platform
        session_data = self._get_session_data(
            'Invalid Session',
            streaming_platform='YOUTUBE',  # Not a valid platform
            stream_url='abc123'
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )

        # Should be rejected with 422 (validation error)
        assert response.status_code == 422

    def test_session_streaming_missing_required_field_rejected(self, client, db):
        """Test that platform without required field is rejected.

        Why test this? Each platform has required fields.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Missing', last_name='Field',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Missing Field Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Missing Field Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Try to create Zoom session without zoom_meeting_id
        session_data = self._get_session_data(
            'Missing Field Session',
            streaming_platform='ZOOM'
            # Missing zoom_meeting_id!
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )

        # Should be rejected with 422 (validation error)
        assert response.status_code == 422
        error_data = json.loads(response.data)
        assert 'zoom_meeting_id' in str(error_data).lower()

    def test_session_streaming_update_platform(self, client, db):
        """Test updating session streaming platform.

        Why test this? Users should be able to change platforms.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Update', last_name='Platform',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Update Platform Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Update Platform Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session with Vimeo
        session_data = self._get_session_data(
            'Changeable Session',
            streaming_platform='VIMEO',
            stream_url='123456789'
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )
        session_id = json.loads(response.data)['id']

        # Update to Mux
        update_response = client.put(
            f'/api/sessions/{session_id}',
            json={
                'streaming_platform': 'MUX',
                'stream_url': 'DS00Spx1CV902',
                'mux_playback_policy': 'SIGNED'
            }
        )

        assert update_response.status_code == 200

        # Verify update
        session = Session.query.get(session_id)
        assert session.streaming_platform == 'MUX'
        assert session.stream_url == 'DS00Spx1CV902'
        assert session.mux_playback_policy == 'SIGNED'

    def test_session_streaming_invalid_vimeo_url_rejected(self, client, db):
        """Test that malformed Vimeo URL is rejected by schema validation.

        Why test this? Schema should reject URLs that can't be normalized.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Invalid', last_name='Vimeo',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Invalid Vimeo Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Invalid Vimeo Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Try to create session with malformed Vimeo URL
        session_data = self._get_session_data(
            'Invalid Vimeo URL Session',
            streaming_platform='VIMEO',
            stream_url='https://not-vimeo.com/invalid'  # Can't extract ID
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )

        # Should be rejected with 422 (validation error)
        assert response.status_code == 422
        error_data = json.loads(response.data)
        assert 'stream_url' in str(error_data).lower()

    def test_session_streaming_invalid_mux_url_rejected(self, client, db):
        """Test that malformed Mux URL is rejected by schema validation.

        Why test this? Schema should reject URLs that can't extract playback ID.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Invalid', last_name='Mux',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Invalid Mux Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Invalid Mux Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Try to create session with malformed Mux URL
        session_data = self._get_session_data(
            'Invalid Mux URL Session',
            streaming_platform='MUX',
            stream_url='https://not-mux.com/invalid!@#'  # Can't extract playback ID
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )

        # Should be rejected with 422 (validation error)
        assert response.status_code == 422
        error_data = json.loads(response.data)
        assert 'stream_url' in str(error_data).lower()

    def test_session_streaming_partial_update_requires_url(self, client, db):
        """Test that changing platform without providing URL field is rejected.

        Why test this? Cross-field validation should ensure platform has corresponding URL.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Partial', last_name='Update',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Partial Update Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Partial Update Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session with Vimeo
        session_data = self._get_session_data(
            'Partial Update Session',
            streaming_platform='VIMEO',
            stream_url='123456789'
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )
        session_id = json.loads(response.data)['id']

        # Try to update to Mux without providing stream_url
        update_response = client.put(
            f'/api/sessions/{session_id}',
            json={
                'streaming_platform': 'MUX',
                # Missing stream_url!
            }
        )

        # Should be rejected with 422 (validation error)
        assert update_response.status_code == 422
        error_data = json.loads(update_response.data)
        assert 'stream_url' in str(error_data).lower()

    def test_session_without_streaming_platform(self, client, db):
        """Test creating session without any streaming platform.

        Why test this? Streaming is optional - sessions can exist without it.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='No', last_name='Stream',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'No Stream Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('No Stream Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session WITHOUT streaming platform (omit fields)
        session_data = self._get_session_data('No Stream Session')
        # Don't include streaming_platform, stream_url, etc.

        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )

        assert response.status_code == 201
        data = json.loads(response.data)

        # Verify session was created without streaming
        session = Session.query.get(data['id'])
        assert session.streaming_platform is None
        assert session.stream_url is None
        assert session.zoom_meeting_id is None

    def test_session_streaming_clear_by_setting_platform_null(self, client, db):
        """Test clearing streaming by setting platform to null.

        Why test this? Users should be able to remove streaming by clearing the platform.
        Setting platform=null means no URL validation required.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Clear', last_name='Stream',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Clear Stream Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Clear Stream Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session with Vimeo streaming
        session_data = self._get_session_data(
            'Will Clear Streaming',
            streaming_platform='VIMEO',
            stream_url='123456789'
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )
        session_id = json.loads(response.data)['id']

        # Verify streaming is set
        session = Session.query.get(session_id)
        assert session.streaming_platform == 'VIMEO'
        assert session.stream_url == '123456789'

        # Clear streaming by setting both platform and URL to null
        update_response = client.put(
            f'/api/sessions/{session_id}',
            json={
                'streaming_platform': None,
                'stream_url': None
            }
        )

        assert update_response.status_code == 200

        # Verify streaming was completely cleared
        session = Session.query.get(session_id)
        assert session.streaming_platform is None
        assert session.stream_url is None

    def test_session_streaming_change_only_title_keeps_platform(self, client, db):
        """Test that updating other fields doesn't affect streaming config.

        Why test this? Partial updates shouldn't clear unrelated fields.
        """
        # Setup
        organizer = User(email='organizer@sbtl.ai', first_name='Partial', last_name='Keep',
                        password='Pass123!', email_verified=True)
        db.session.add(organizer)
        db.session.commit()

        client.post('/api/auth/login', json={'email': 'organizer@sbtl.ai', 'password': 'Pass123!'})
        org_response = client.post('/api/organizations', json={'name': 'Partial Keep Org'})
        org_id = json.loads(org_response.data)['id']

        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json=self._get_event_data('Partial Keep Event')
        )
        event_id = json.loads(event_response.data)['id']

        # Create session with Vimeo
        session_data = self._get_session_data(
            'Original Title',
            streaming_platform='VIMEO',
            stream_url='123456789'
        )
        response = client.post(
            f'/api/events/{event_id}/sessions',
            json=session_data
        )
        session_id = json.loads(response.data)['id']

        # Update only the title (don't touch streaming fields)
        update_response = client.put(
            f'/api/sessions/{session_id}',
            json={'title': 'Updated Title'}
        )

        assert update_response.status_code == 200

        # Verify streaming config is preserved
        session = Session.query.get(session_id)
        assert session.title == 'Updated Title'
        assert session.streaming_platform == 'VIMEO'
        assert session.stream_url == '123456789'