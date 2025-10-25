"""
Connection Integration Tests

These tests verify the complete networking/connection system including:
- Connection request flow (send, accept, reject)
- Icebreaker messages and DM thread creation
- Privacy filtering and data visibility
- Event-scoped connections
- Connection removal and restoration
- Pending request management
"""

import json
from datetime import datetime, timedelta, timezone
from api.models import (
    User, Organization, Event, EventUser, OrganizationUser,
    Connection, DirectMessageThread, DirectMessage
)
from api.models.enums import (
    EventUserRole, OrganizationUserRole, ConnectionStatus,
    EmailVisibility, ConnectionRequestPermission, SocialLinksVisibility
)


class TestConnectionIntegration:
    """Test complete connection workflows from API to database."""

    def test_connection_request_flow(self, client, db):
        """Test sending, accepting, and rejecting connection requests.

        Why test this? Connections are the primary networking mechanism
        for attendees to build professional relationships at events.
        """
        # Create users and event
        alice = User(email='alice@sbtl.ai', first_name='Alice', last_name='Attendee',
                     password='Pass123!', email_verified=True)
        bob = User(email='bob@sbtl.ai', first_name='Bob', last_name='Builder',
                   password='Pass123!', email_verified=True)
        charlie = User(email='charlie@sbtl.ai', first_name='Charlie', last_name='Connector',
                      password='Pass123!', email_verified=True)
        db.session.add_all([alice, bob, charlie])
        db.session.commit()

        # Alice creates org and event
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        org_response = client.post('/api/organizations',
                                  json={'name': 'Networking Org'})
        org_id = json.loads(org_response.data)['id']

        utc_now = datetime.now(timezone.utc).date()
        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json={
                'title': 'Tech Conference 2025',
                'event_type': 'CONFERENCE',
                'start_date': (utc_now + timedelta(days=30)).isoformat(),
                'end_date': (utc_now + timedelta(days=31)).isoformat(),
                'company_name': 'Network Co',
                'timezone': 'UTC'
            }
        )
        event_id = json.loads(event_response.data)['id']

        # Add Bob and Charlie to event
        event_user_bob = EventUser(event_id=event_id, user_id=bob.id,
                                   role=EventUserRole.ATTENDEE)
        event_user_charlie = EventUser(event_id=event_id, user_id=charlie.id,
                                      role=EventUserRole.ATTENDEE)
        db.session.add_all([event_user_bob, event_user_charlie])
        db.session.commit()

        # Bob sends connection request to Charlie with icebreaker
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        connection_response = client.post(
            '/api/connections',
            json={
                'recipient_id': charlie.id,
                'icebreaker_message': 'Hi Charlie! Great to meet you at the conference!',
                'originating_event_id': event_id
            }
        )
        assert connection_response.status_code == 201
        connection_data = json.loads(connection_response.data)
        assert connection_data['status'] == 'PENDING'
        assert connection_data['icebreaker_message'] == 'Hi Charlie! Great to meet you at the conference!'
        assert connection_data['originating_event']['id'] == event_id
        connection_id = connection_data['id']

        # Charlie can see the pending request
        client.post('/api/auth/login',
                   json={'email': 'charlie@sbtl.ai', 'password': 'Pass123!'})

        pending_response = client.get('/api/connections/pending')
        assert pending_response.status_code == 200
        pending_data = json.loads(pending_response.data)
        assert pending_data['total_items'] == 1
        assert pending_data['connections'][0]['id'] == connection_id

        # Charlie accepts the connection
        accept_response = client.put(
            f'/api/connections/{connection_id}',
            json={'status': 'ACCEPTED'}
        )
        assert accept_response.status_code == 200
        accepted_data = json.loads(accept_response.data)
        assert accepted_data['status'] == 'ACCEPTED'

        # Bob tries to send another request (should fail - already connected)
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        duplicate_response = client.post(
            '/api/connections',
            json={
                'recipient_id': charlie.id,
                'icebreaker_message': 'Another message',
                'originating_event_id': event_id
            }
        )
        assert duplicate_response.status_code == 400
        assert 'already exists' in json.loads(duplicate_response.data)['message']

        # Alice sends request to Bob
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        alice_connection_response = client.post(
            '/api/connections',
            json={
                'recipient_id': bob.id,
                'icebreaker_message': 'Hi Bob! Let\'s connect!',
                'originating_event_id': event_id
            }
        )
        assert alice_connection_response.status_code == 201
        alice_connection_id = json.loads(alice_connection_response.data)['id']

        # Bob rejects Alice's request
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        reject_response = client.put(
            f'/api/connections/{alice_connection_id}',
            json={'status': 'REJECTED'}
        )
        assert reject_response.status_code == 200
        assert json.loads(reject_response.data)['status'] == 'REJECTED'

    def test_icebreaker_message_to_dm_thread(self, client, db):
        """Test that accepting a connection creates a DM thread with icebreaker.

        Why test this? The icebreaker message should become the first
        message in the DM thread, seamlessly transitioning from
        connection to conversation.
        """
        # Create users and event
        alice = User(email='alice@sbtl.ai', first_name='Alice', last_name='Attendee',
                     password='Pass123!', email_verified=True)
        bob = User(email='bob@sbtl.ai', first_name='Bob', last_name='Builder',
                   password='Pass123!', email_verified=True)
        db.session.add_all([alice, bob])
        db.session.commit()

        # Setup event
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        org_response = client.post('/api/organizations',
                                  json={'name': 'DM Test Org'})
        org_id = json.loads(org_response.data)['id']

        utc_now = datetime.now(timezone.utc).date()
        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json={
                'title': 'Networking Event',
                'event_type': 'CONFERENCE',
                'start_date': (utc_now + timedelta(days=30)).isoformat(),
                'end_date': (utc_now + timedelta(days=31)).isoformat(),
                'company_name': 'DM Co',
                'timezone': 'UTC'
            }
        )
        event_id = json.loads(event_response.data)['id']

        # Add Bob to event
        event_user_bob = EventUser(event_id=event_id, user_id=bob.id,
                                  role=EventUserRole.ATTENDEE)
        db.session.add(event_user_bob)
        db.session.commit()

        # Alice sends connection request with icebreaker
        icebreaker = 'Looking forward to discussing AI innovations with you!'
        connection_response = client.post(
            '/api/connections',
            json={
                'recipient_id': bob.id,
                'icebreaker_message': icebreaker,
                'originating_event_id': event_id
            }
        )
        assert connection_response.status_code == 201
        connection_id = json.loads(connection_response.data)['id']

        # Verify no DM thread exists yet
        thread = DirectMessageThread.query.filter(
            ((DirectMessageThread.user1_id == alice.id) &
             (DirectMessageThread.user2_id == bob.id)) |
            ((DirectMessageThread.user1_id == bob.id) &
             (DirectMessageThread.user2_id == alice.id))
        ).first()
        assert thread is None

        # Bob accepts the connection
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        accept_response = client.put(
            f'/api/connections/{connection_id}',
            json={'status': 'ACCEPTED'}
        )
        assert accept_response.status_code == 200

        # Verify DM thread was created
        thread = DirectMessageThread.query.filter(
            ((DirectMessageThread.user1_id == alice.id) &
             (DirectMessageThread.user2_id == bob.id)) |
            ((DirectMessageThread.user1_id == bob.id) &
             (DirectMessageThread.user2_id == alice.id))
        ).first()
        assert thread is not None
        assert thread.event_scope_id is None  # Global thread

        # Verify icebreaker message exists
        messages = DirectMessage.query.filter_by(thread_id=thread.id).all()
        assert len(messages) == 1
        assert messages[0].content == icebreaker
        assert messages[0].sender_id == alice.id

        # Bob can now send messages in the thread
        dm_response = client.post(
            f'/api/direct-messages/threads/{thread.id}/messages',
            json={'content': 'Thanks for connecting, Alice!'}
        )
        assert dm_response.status_code == 201

    def test_connection_listing_with_filters(self, client, db):
        """Test listing connections with various status filters.

        Why test this? Users need to manage their connections and
        see different views (all, pending, accepted, etc).
        """
        # Create users
        alice = User(email='alice@sbtl.ai', first_name='Alice', last_name='User',
                     password='Pass123!', email_verified=True)
        bob = User(email='bob@sbtl.ai', first_name='Bob', last_name='User',
                   password='Pass123!', email_verified=True)
        charlie = User(email='charlie@sbtl.ai', first_name='Charlie', last_name='User',
                      password='Pass123!', email_verified=True)
        david = User(email='david@sbtl.ai', first_name='David', last_name='User',
                    password='Pass123!', email_verified=True)
        db.session.add_all([alice, bob, charlie, david])
        db.session.commit()

        # Create connections with different statuses
        conn1 = Connection(requester_id=alice.id, recipient_id=bob.id,
                          status=ConnectionStatus.ACCEPTED,
                          icebreaker_message='Great to connect!')
        conn2 = Connection(requester_id=charlie.id, recipient_id=alice.id,
                          status=ConnectionStatus.PENDING,
                          icebreaker_message='Would love to connect')
        conn3 = Connection(requester_id=alice.id, recipient_id=david.id,
                          status=ConnectionStatus.REJECTED,
                          icebreaker_message='Let\'s network')
        db.session.add_all([conn1, conn2, conn3])
        db.session.commit()

        # Login as Alice
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        # Get all connections
        all_response = client.get('/api/connections')
        assert all_response.status_code == 200
        all_data = json.loads(all_response.data)
        assert all_data['total_items'] == 3

        # Filter by ACCEPTED status
        accepted_response = client.get('/api/connections?status=ACCEPTED')
        assert accepted_response.status_code == 200
        accepted_data = json.loads(accepted_response.data)
        assert accepted_data['total_items'] == 1
        assert accepted_data['connections'][0]['status'] == 'ACCEPTED'

        # Filter by PENDING status
        pending_response = client.get('/api/connections?status=PENDING')
        assert pending_response.status_code == 200
        pending_data = json.loads(pending_response.data)
        assert pending_data['total_items'] == 1
        assert pending_data['connections'][0]['status'] == 'PENDING'

        # Filter by REJECTED status
        rejected_response = client.get('/api/connections?status=REJECTED')
        assert rejected_response.status_code == 200
        rejected_data = json.loads(rejected_response.data)
        assert rejected_data['total_items'] == 1
        assert rejected_data['connections'][0]['status'] == 'REJECTED'

        # Test pagination
        page1_response = client.get('/api/connections?per_page=2&page=1')
        assert page1_response.status_code == 200
        page1_data = json.loads(page1_response.data)
        assert len(page1_data['connections']) == 2
        assert page1_data['current_page'] == 1

        page2_response = client.get('/api/connections?per_page=2&page=2')
        assert page2_response.status_code == 200
        page2_data = json.loads(page2_response.data)
        assert len(page2_data['connections']) == 1
        assert page2_data['current_page'] == 2

    def test_privacy_filtering_in_connections(self, client, db):
        """Test that privacy settings are applied to connection user data.

        Why test this? User privacy is critical - connection data should
        respect privacy settings for email, company, and social visibility.
        """
        # Create users with different privacy settings
        alice = User(
            email='alice@sbtl.ai', first_name='Alice', last_name='Private',
            password='Pass123!', email_verified=True,
            company_name='Secret Corp',
            title='Hidden Title',
            social_links={'linkedin': 'https://linkedin.com/in/alice'},
            privacy_settings={
                "email_visibility": "connections_organizers",  # Show to connections and organizers
                "show_public_email": False,
                "public_email": None,
                "allow_connection_requests": "event_attendees",
                "show_social_links": "hidden",  # Hide from everyone
                "show_company": False,
                "show_bio": False
            }
        )
        bob = User(
            email='bob@sbtl.ai', first_name='Bob', last_name='Public',
            password='Pass123!', email_verified=True,
            company_name='Public Inc',
            title='Open Role',
            privacy_settings={
                "email_visibility": "event_attendees",  # Show to all event attendees
                "show_public_email": False,
                "public_email": None,
                "allow_connection_requests": "event_attendees",
                "show_social_links": "event_attendees",  # Show to event attendees
                "show_company": True,
                "show_bio": True
            }
        )
        charlie = User(
            email='charlie@sbtl.ai', first_name='Charlie', last_name='Stranger',
            password='Pass123!', email_verified=True
        )
        db.session.add_all([alice, bob, charlie])
        db.session.commit()

        # Create accepted connection between Alice and Bob
        connection = Connection(
            requester_id=alice.id, recipient_id=bob.id,
            status=ConnectionStatus.ACCEPTED,
            icebreaker_message='Connected!'
        )
        db.session.add(connection)
        db.session.commit()

        # Charlie (not connected) views connections - shouldn't see private data
        client.post('/api/auth/login',
                   json={'email': 'charlie@sbtl.ai', 'password': 'Pass123!'})

        # Charlie sends pending request to Alice
        pending_connection = Connection(
            requester_id=charlie.id, recipient_id=alice.id,
            status=ConnectionStatus.PENDING,
            icebreaker_message='Want to connect'
        )
        db.session.add(pending_connection)
        db.session.commit()

        # Alice views her connections
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        connections_response = client.get('/api/connections')
        assert connections_response.status_code == 200
        connections_data = json.loads(connections_response.data)

        # Find Bob's data in Alice's connections
        bob_connection = next(
            c for c in connections_data['connections']
            if c['recipient']['id'] == bob.id or c['requester']['id'] == bob.id
        )

        # Bob's public data should be visible to connected Alice
        bob_data = bob_connection['recipient'] if bob_connection['recipient']['id'] == bob.id else bob_connection['requester']
        assert bob_data['email'] == 'bob@sbtl.ai'  # Bob shows email to everyone
        assert bob_data['company_name'] == 'Public Inc'
        assert bob_data['title'] == 'Open Role'

        # Bob views connections to see Alice's data
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        bob_connections_response = client.get('/api/connections')
        assert bob_connections_response.status_code == 200
        bob_connections_data = json.loads(bob_connections_response.data)

        alice_connection = bob_connections_data['connections'][0]
        alice_data = alice_connection['requester'] if alice_connection['requester']['id'] == alice.id else alice_connection['recipient']

        # Alice shows email only to connected users, Bob is connected
        assert alice_data['email'] == 'alice@sbtl.ai'
        # Alice hides company and title
        assert alice_data['company_name'] is None
        assert alice_data['title'] is None
        # Alice hides social links from everyone
        assert alice_data['social_links'] is None

    def test_event_scoped_connections(self, client, db):
        """Test connections within event context and event connections endpoint.

        Why test this? Connections are primarily event-scoped - attendees
        connect at events, and we need to track which connections
        originated from which events.
        """
        # Create users
        alice = User(email='alice@sbtl.ai', first_name='Alice', last_name='User',
                     password='Pass123!', email_verified=True)
        bob = User(email='bob@sbtl.ai', first_name='Bob', last_name='User',
                   password='Pass123!', email_verified=True)
        charlie = User(email='charlie@sbtl.ai', first_name='Charlie', last_name='User',
                      password='Pass123!', email_verified=True)
        db.session.add_all([alice, bob, charlie])
        db.session.commit()

        # Create event
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        org_response = client.post('/api/organizations',
                                  json={'name': 'Event Org'})
        org_id = json.loads(org_response.data)['id']

        utc_now = datetime.now(timezone.utc).date()
        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json={
                'title': 'Networking Summit',
                'event_type': 'CONFERENCE',
                'start_date': (utc_now + timedelta(days=30)).isoformat(),
                'end_date': (utc_now + timedelta(days=31)).isoformat(),
                'company_name': 'Summit Co',
                'timezone': 'UTC'
            }
        )
        event_id = json.loads(event_response.data)['id']

        # Add Bob and Charlie to event
        event_user_bob = EventUser(event_id=event_id, user_id=bob.id,
                                  role=EventUserRole.ATTENDEE)
        event_user_charlie = EventUser(event_id=event_id, user_id=charlie.id,
                                       role=EventUserRole.SPEAKER)
        db.session.add_all([event_user_bob, event_user_charlie])
        db.session.commit()

        # Alice sends connection to Bob with event context
        connection1_response = client.post(
            '/api/connections',
            json={
                'recipient_id': bob.id,
                'icebreaker_message': 'Great meeting you at the summit!',
                'originating_event_id': event_id
            }
        )
        assert connection1_response.status_code == 201
        conn1_id = json.loads(connection1_response.data)['id']

        # Bob accepts
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        client.put(f'/api/connections/{conn1_id}',
                  json={'status': 'ACCEPTED'})

        # Bob connects with Charlie at the event
        connection2_response = client.post(
            '/api/connections',
            json={
                'recipient_id': charlie.id,
                'icebreaker_message': 'Your talk was inspiring!',
                'originating_event_id': event_id
            }
        )
        assert connection2_response.status_code == 201
        conn2_id = json.loads(connection2_response.data)['id']

        # Charlie accepts
        client.post('/api/auth/login',
                   json={'email': 'charlie@sbtl.ai', 'password': 'Pass123!'})

        client.put(f'/api/connections/{conn2_id}',
                  json={'status': 'ACCEPTED'})

        # Test event connections endpoint - Alice sees Bob (her connection in event)
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        event_connections_response = client.get(f'/api/events/{event_id}/connections')
        assert event_connections_response.status_code == 200
        event_connections = json.loads(event_connections_response.data)

        # Alice should see Bob (connected to her and in the event)
        assert event_connections['total_items'] == 1
        assert event_connections['users'][0]['id'] == bob.id

        # Bob sees both Alice and Charlie
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        bob_event_connections = client.get(f'/api/events/{event_id}/connections')
        assert bob_event_connections.status_code == 200
        bob_connections_data = json.loads(bob_event_connections.data)
        assert bob_connections_data['total_items'] == 2

        user_ids = [u['id'] for u in bob_connections_data['users']]
        assert alice.id in user_ids
        assert charlie.id in user_ids

        # Non-event member can't access event connections
        non_member = User(email='outsider@sbtl.ai', first_name='Out', last_name='Sider',
                         password='Pass123!', email_verified=True)
        db.session.add(non_member)
        db.session.commit()

        client.post('/api/auth/login',
                   json={'email': 'outsider@sbtl.ai', 'password': 'Pass123!'})

        outsider_response = client.get(f'/api/events/{event_id}/connections')
        assert outsider_response.status_code == 403

    def test_connection_removal_flow(self, client, db):
        """Test removing a connection and its effect on DM threads.

        Why test this? Users should be able to disconnect, which
        removes the global DM thread but preserves event-scoped threads.
        """
        # Create users and event
        alice = User(email='alice@sbtl.ai', first_name='Alice', last_name='User',
                     password='Pass123!', email_verified=True)
        bob = User(email='bob@sbtl.ai', first_name='Bob', last_name='User',
                   password='Pass123!', email_verified=True)
        db.session.add_all([alice, bob])
        db.session.commit()

        # Create event
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        org_response = client.post('/api/organizations',
                                  json={'name': 'Remove Test Org'})
        org_id = json.loads(org_response.data)['id']

        utc_now = datetime.now(timezone.utc).date()
        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json={
                'title': 'Tech Event',
                'event_type': 'CONFERENCE',
                'start_date': (utc_now + timedelta(days=30)).isoformat(),
                'end_date': (utc_now + timedelta(days=31)).isoformat(),
                'company_name': 'Tech Co',
                'timezone': 'UTC'
            }
        )
        event_id = json.loads(event_response.data)['id']

        # Add Bob to event
        event_user_bob = EventUser(event_id=event_id, user_id=bob.id,
                                  role=EventUserRole.ATTENDEE)
        db.session.add(event_user_bob)
        db.session.commit()

        # Create event-scoped DM thread first
        event_thread = DirectMessageThread(
            user1_id=alice.id, user2_id=bob.id,
            event_scope_id=event_id, is_encrypted=False
        )
        db.session.add(event_thread)
        db.session.commit()

        # Alice sends connection request
        connection_response = client.post(
            '/api/connections',
            json={
                'recipient_id': bob.id,
                'icebreaker_message': 'Let\'s connect!',
                'originating_event_id': event_id
            }
        )
        assert connection_response.status_code == 201
        connection_id = json.loads(connection_response.data)['id']

        # Bob accepts - this creates global thread and merges event thread
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        accept_response = client.put(f'/api/connections/{connection_id}',
                                    json={'status': 'ACCEPTED'})
        assert accept_response.status_code == 200

        # Verify global thread exists
        global_thread = DirectMessageThread.query.filter(
            ((DirectMessageThread.user1_id == alice.id) &
             (DirectMessageThread.user2_id == bob.id)) |
            ((DirectMessageThread.user1_id == bob.id) &
             (DirectMessageThread.user2_id == alice.id)),
            DirectMessageThread.event_scope_id.is_(None)
        ).first()
        assert global_thread is not None

        # Alice removes the connection
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        remove_response = client.delete(f'/api/connections/{connection_id}')
        assert remove_response.status_code == 204

        # Verify connection status is REMOVED
        connection = Connection.query.get(connection_id)
        assert connection.status == ConnectionStatus.REMOVED

        # Verify global thread is deleted
        global_thread = DirectMessageThread.query.filter(
            ((DirectMessageThread.user1_id == alice.id) &
             (DirectMessageThread.user2_id == bob.id)) |
            ((DirectMessageThread.user1_id == bob.id) &
             (DirectMessageThread.user2_id == alice.id)),
            DirectMessageThread.event_scope_id.is_(None)
        ).first()
        assert global_thread is None

        # Event-scoped threads should still be accessible
        # (Note: In this test flow, event thread was merged, so it won't exist)

    def test_duplicate_connection_prevention(self, client, db):
        """Test that duplicate connections are prevented and REMOVED can be reused.

        Why test this? The system should prevent duplicate connections
        but allow reconnection after removal.
        """
        # Create users
        alice = User(email='alice@sbtl.ai', first_name='Alice', last_name='User',
                     password='Pass123!', email_verified=True)
        bob = User(email='bob@sbtl.ai', first_name='Bob', last_name='User',
                   password='Pass123!', email_verified=True)
        db.session.add_all([alice, bob])
        db.session.commit()

        # Create organization and event
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        org_response = client.post('/api/organizations',
                                  json={'name': 'Test Org'})
        org_id = json.loads(org_response.data)['id']

        utc_now = datetime.now(timezone.utc).date()
        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json={
                'title': 'Test Event',
                'event_type': 'CONFERENCE',
                'start_date': (utc_now + timedelta(days=30)).isoformat(),
                'end_date': (utc_now + timedelta(days=31)).isoformat(),
                'company_name': 'Test Co',
                'timezone': 'UTC'
            }
        )
        event_id = json.loads(event_response.data)['id']

        # Add Bob to event
        event_user_bob = EventUser(event_id=event_id, user_id=bob.id,
                                   role=EventUserRole.ATTENDEE)
        db.session.add(event_user_bob)
        db.session.commit()

        # Alice sends connection request to Bob
        first_response = client.post(
            '/api/connections',
            json={
                'recipient_id': bob.id,
                'icebreaker_message': 'First connection attempt',
                'originating_event_id': event_id
            }
        )
        assert first_response.status_code == 201
        connection_id = json.loads(first_response.data)['id']

        # Alice tries to send another request (should fail - pending exists)
        duplicate_response = client.post(
            '/api/connections',
            json={
                'recipient_id': bob.id,
                'icebreaker_message': 'Duplicate attempt',
                'originating_event_id': event_id
            }
        )
        assert duplicate_response.status_code == 400
        assert 'already exists' in json.loads(duplicate_response.data)['message']

        # Bob accepts the connection
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        client.put(f'/api/connections/{connection_id}',
                  json={'status': 'ACCEPTED'})

        # Bob tries to send request to Alice (should fail - already connected)
        reverse_response = client.post(
            '/api/connections',
            json={
                'recipient_id': alice.id,
                'icebreaker_message': 'Reverse connection',
                'originating_event_id': event_id
            }
        )
        assert reverse_response.status_code == 400
        assert 'already exists' in json.loads(reverse_response.data)['message']

        # Alice removes the connection
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        client.delete(f'/api/connections/{connection_id}')

        # Now Bob can send a new connection request (reusing REMOVED)
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        new_connection_response = client.post(
            '/api/connections',
            json={
                'recipient_id': alice.id,
                'icebreaker_message': 'Let\'s reconnect!',
                'originating_event_id': event_id
            }
        )
        assert new_connection_response.status_code == 201
        new_data = json.loads(new_connection_response.data)
        # It reuses the same connection ID
        assert new_data['id'] == connection_id
        assert new_data['status'] == 'PENDING'
        assert new_data['icebreaker_message'] == 'Let\'s reconnect!'
        assert new_data['requester']['id'] == bob.id
        assert new_data['recipient']['id'] == alice.id

    def test_pending_requests_endpoint(self, client, db):
        """Test the pending connection requests endpoint.

        Why test this? Users need a dedicated view of incoming
        connection requests they need to act on.
        """
        # Create users
        alice = User(email='alice@sbtl.ai', first_name='Alice', last_name='Popular',
                     password='Pass123!', email_verified=True)
        bob = User(email='bob@sbtl.ai', first_name='Bob', last_name='Sender',
                   password='Pass123!', email_verified=True)
        charlie = User(email='charlie@sbtl.ai', first_name='Charlie', last_name='Sender',
                      password='Pass123!', email_verified=True)
        david = User(email='david@sbtl.ai', first_name='David', last_name='Sender',
                    password='Pass123!', email_verified=True)
        db.session.add_all([alice, bob, charlie, david])
        db.session.commit()

        # Multiple users send requests to Alice
        conn1 = Connection(requester_id=bob.id, recipient_id=alice.id,
                          status=ConnectionStatus.PENDING,
                          icebreaker_message='Hi Alice from Bob!')
        conn2 = Connection(requester_id=charlie.id, recipient_id=alice.id,
                          status=ConnectionStatus.PENDING,
                          icebreaker_message='Hi Alice from Charlie!')
        conn3 = Connection(requester_id=david.id, recipient_id=alice.id,
                          status=ConnectionStatus.ACCEPTED,  # Already accepted
                          icebreaker_message='Hi Alice from David!')
        # Alice sent this one
        conn4 = Connection(requester_id=alice.id, recipient_id=bob.id,
                          status=ConnectionStatus.PENDING,
                          icebreaker_message='Hi Bob from Alice!')
        db.session.add_all([conn1, conn2, conn3, conn4])
        db.session.commit()

        # Alice checks pending requests
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        pending_response = client.get('/api/connections/pending')
        assert pending_response.status_code == 200
        pending_data = json.loads(pending_response.data)

        # Should only see pending requests TO Alice (not from Alice)
        assert pending_data['total_items'] == 2

        # Verify the requests are from Bob and Charlie
        requester_ids = [c['requester']['id'] for c in pending_data['connections']]
        assert bob.id in requester_ids
        assert charlie.id in requester_ids

        # All should be PENDING status
        for conn in pending_data['connections']:
            assert conn['status'] == 'PENDING'
            assert conn['recipient']['id'] == alice.id

        # Bob checks his pending requests
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        bob_pending_response = client.get('/api/connections/pending')
        assert bob_pending_response.status_code == 200
        bob_pending_data = json.loads(bob_pending_response.data)

        # Bob should see Alice's request to him
        assert bob_pending_data['total_items'] == 1
        assert bob_pending_data['connections'][0]['requester']['id'] == alice.id

    def test_connection_authorization(self, client, db):
        """Test authorization rules for connection operations.

        Why test this? Only participants should be able to view/modify
        their connections, and only recipients can accept/reject.
        """
        # Create users
        alice = User(email='alice@sbtl.ai', first_name='Alice', last_name='User',
                     password='Pass123!', email_verified=True)
        bob = User(email='bob@sbtl.ai', first_name='Bob', last_name='User',
                   password='Pass123!', email_verified=True)
        charlie = User(email='charlie@sbtl.ai', first_name='Charlie', last_name='Outsider',
                      password='Pass123!', email_verified=True)
        db.session.add_all([alice, bob, charlie])
        db.session.commit()

        # Create organization and event
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        org_response = client.post('/api/organizations',
                                  json={'name': 'Test Org'})
        org_id = json.loads(org_response.data)['id']

        utc_now = datetime.now(timezone.utc).date()
        event_response = client.post(
            f'/api/organizations/{org_id}/events',
            json={
                'title': 'Test Event',
                'event_type': 'CONFERENCE',
                'start_date': (utc_now + timedelta(days=30)).isoformat(),
                'end_date': (utc_now + timedelta(days=31)).isoformat(),
                'company_name': 'Test Co',
                'timezone': 'UTC'
            }
        )
        event_id = json.loads(event_response.data)['id']

        # Add Bob to event
        event_user_bob = EventUser(event_id=event_id, user_id=bob.id,
                                   role=EventUserRole.ATTENDEE)
        db.session.add(event_user_bob)
        db.session.commit()

        # Alice sends connection to Bob
        connection_response = client.post(
            '/api/connections',
            json={
                'recipient_id': bob.id,
                'icebreaker_message': 'Private connection',
                'originating_event_id': event_id
            }
        )
        assert connection_response.status_code == 201
        connection_id = json.loads(connection_response.data)['id']

        # Charlie (outsider) tries to view the connection
        client.post('/api/auth/login',
                   json={'email': 'charlie@sbtl.ai', 'password': 'Pass123!'})

        view_response = client.get(f'/api/connections/{connection_id}')
        assert view_response.status_code == 403

        # Charlie tries to accept the connection (not the recipient)
        accept_response = client.put(
            f'/api/connections/{connection_id}',
            json={'status': 'ACCEPTED'}
        )
        assert accept_response.status_code == 400
        assert 'Only the recipient' in json.loads(accept_response.data)['message']

        # Alice (requester) tries to accept her own request
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        self_accept_response = client.put(
            f'/api/connections/{connection_id}',
            json={'status': 'ACCEPTED'}
        )
        assert self_accept_response.status_code == 400
        assert 'Only the recipient' in json.loads(self_accept_response.data)['message']

        # Bob (recipient) can accept
        client.post('/api/auth/login',
                   json={'email': 'bob@sbtl.ai', 'password': 'Pass123!'})

        bob_accept_response = client.put(
            f'/api/connections/{connection_id}',
            json={'status': 'ACCEPTED'}
        )
        assert bob_accept_response.status_code == 200

        # Charlie tries to remove the connection (not authorized)
        client.post('/api/auth/login',
                   json={'email': 'charlie@sbtl.ai', 'password': 'Pass123!'})

        remove_response = client.delete(f'/api/connections/{connection_id}')
        assert remove_response.status_code == 400
        assert 'Not authorized' in json.loads(remove_response.data)['message']

        # Both Alice and Bob can remove their connection
        client.post('/api/auth/login',
                   json={'email': 'alice@sbtl.ai', 'password': 'Pass123!'})

        alice_remove_response = client.delete(f'/api/connections/{connection_id}')
        assert alice_remove_response.status_code == 204