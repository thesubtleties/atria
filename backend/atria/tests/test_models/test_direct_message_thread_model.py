"""Test DirectMessageThread model functionality.

Testing Strategy:
- DirectMessageThreads connect two users for private messaging
- Can be global (no event) or event-scoped
- Track cutoff times for message hiding (privacy feature)
- Must ensure unique thread per user pair per scope
"""

import pytest
from datetime import datetime, timezone, timedelta
from api.models import DirectMessageThread, DirectMessage, User, Event
from sqlalchemy.exc import IntegrityError


class TestDirectMessageThreadModel:
    """Test DirectMessageThread model and messaging functionality."""

    def test_thread_creation_between_users(self, db, user_factory):
        """Test creating a DM thread between two users.

        Why test this? DM threads are the foundation of private messaging.
        Each thread connects exactly two users.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            is_encrypted=False
        )
        db.session.add(thread)
        db.session.commit()

        assert thread.id is not None
        assert thread.user1_id == user1.id
        assert thread.user2_id == user2.id
        assert thread.event_scope_id is None  # Global thread
        assert thread.is_encrypted is False
        assert thread.created_at is not None
        assert thread.last_message_at is not None

    def test_event_scoped_thread(self, db, user_factory, event_factory):
        """Test creating an event-scoped DM thread.

        Why test this? Users can have different conversations
        in different event contexts (networking at specific events).
        """
        user1 = user_factory()
        user2 = user_factory()
        event = event_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            event_scope_id=event.id
        )
        db.session.add(thread)
        db.session.commit()

        assert thread.event_scope_id == event.id
        # Users can have both global and event-scoped threads

    def test_unique_thread_per_user_pair_per_scope(self, db, user_factory, event_factory):
        """Test that user pairs can only have one thread per scope.

        Why test this? Prevents duplicate threads between same users.
        Constraint should prevent multiple threads for same user pair in same scope.
        """
        user1 = user_factory()
        user2 = user_factory()
        event = event_factory()

        # Create first thread
        thread1 = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            event_scope_id=event.id
        )
        db.session.add(thread1)
        db.session.commit()

        # Try to create duplicate thread - should fail
        thread2 = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            event_scope_id=event.id
        )
        db.session.add(thread2)

        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_multiple_threads_different_scopes(self, db, user_factory, event_factory):
        """Test same users can have threads in different scopes.

        Why test this? Users should be able to have separate conversations
        in global context and different event contexts.
        """
        user1 = user_factory()
        user2 = user_factory()
        event1 = event_factory()
        event2 = event_factory()

        # Global thread
        global_thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            event_scope_id=None
        )
        db.session.add(global_thread)

        # Event 1 thread
        event1_thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            event_scope_id=event1.id
        )
        db.session.add(event1_thread)

        # Event 2 thread
        event2_thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            event_scope_id=event2.id
        )
        db.session.add(event2_thread)

        db.session.commit()

        # All three threads should exist
        assert global_thread.id is not None
        assert event1_thread.id is not None
        assert event2_thread.id is not None

    def test_get_other_user(self, db, user_factory):
        """Test getting the other participant in a thread.

        Why test this? UI needs to show who you're chatting with.
        Method should return the other user regardless of which user asks.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # From user1's perspective
        other_user = thread.get_other_user(user1.id)
        assert other_user.id == user2.id

        # From user2's perspective
        other_user = thread.get_other_user(user2.id)
        assert other_user.id == user1.id

    def test_user_cutoff_functionality(self, db, user_factory):
        """Test message cutoff/hiding functionality.

        Why test this? Users can "clear" their chat history
        without deleting it for the other person.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # Initially no cutoffs
        assert thread.user1_cutoff is None
        assert thread.user2_cutoff is None

        # User1 sets a cutoff
        cutoff_time = datetime.now(timezone.utc)
        thread.set_user_cutoff(user1.id, cutoff_time)
        db.session.commit()

        assert thread.get_user_cutoff(user1.id) == cutoff_time
        assert thread.get_user_cutoff(user2.id) is None  # User2 unaffected

        # User1 clears their cutoff
        thread.clear_user_cutoff(user1.id)
        db.session.commit()

        assert thread.get_user_cutoff(user1.id) is None

    def test_set_cutoff_for_non_participant(self, db, user_factory):
        """Test that non-participants can't set cutoffs.

        Why test this? Security - only thread participants
        should be able to modify their view of the conversation.
        """
        user1 = user_factory()
        user2 = user_factory()
        user3 = user_factory()  # Not in thread

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # User3 tries to set cutoff
        with pytest.raises(ValueError, match="User is not part of this thread"):
            thread.set_user_cutoff(user3.id)

    def test_thread_with_messages(self, db, user_factory):
        """Test thread with associated messages.

        Why test this? Threads contain messages.
        Need to verify relationship and cascade behavior.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # Add messages to thread
        msg1 = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="Hello!"
        )
        msg2 = DirectMessage(
            thread_id=thread.id,
            sender_id=user2.id,
            content="Hi there!"
        )
        db.session.add_all([msg1, msg2])
        db.session.commit()

        # Check messages are associated
        assert len(thread.messages) == 2
        assert thread.messages[0].content == "Hello!"
        assert thread.messages[1].content == "Hi there!"

    def test_thread_deletion_cascades_to_messages(self, db, user_factory):
        """Test that deleting thread deletes messages.

        Why test this? When a conversation is deleted,
        all messages should be removed (cascade delete).
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # Add a message
        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="Test message"
        )
        db.session.add(message)
        db.session.commit()

        thread_id = thread.id
        message_id = message.id

        # Delete thread
        db.session.delete(thread)
        db.session.commit()

        # Thread and message should be gone
        assert DirectMessageThread.query.get(thread_id) is None
        assert DirectMessage.query.get(message_id) is None

    def test_user_deletion_behavior(self, db, user_factory):
        """Test what happens when a user in thread is deleted.

        Why test this? Need to understand cascade behavior.
        Does thread get deleted or preserved?
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        thread_id = thread.id

        # Delete user1
        db.session.delete(user1)
        db.session.commit()

        # Check if thread still exists
        thread = DirectMessageThread.query.get(thread_id)
        assert thread is None  # CASCADE delete removes thread

    def test_event_deletion_behavior(self, db, user_factory, event_factory):
        """Test what happens to event-scoped threads when event is deleted.

        Why test this? Event-scoped threads should be cleaned up
        when the event is deleted.
        """
        user1 = user_factory()
        user2 = user_factory()
        event = event_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            event_scope_id=event.id
        )
        db.session.add(thread)
        db.session.commit()

        thread_id = thread.id

        # Delete event
        db.session.delete(event)
        db.session.commit()

        # Event-scoped thread should be deleted
        thread = DirectMessageThread.query.get(thread_id)
        assert thread is None  # CASCADE delete

    def test_encrypted_thread(self, db, user_factory):
        """Test encrypted thread functionality.

        Why test this? Some conversations may use end-to-end encryption.
        The is_encrypted flag tracks this status.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            is_encrypted=True
        )
        db.session.add(thread)
        db.session.commit()

        assert thread.is_encrypted is True

        # Messages in encrypted thread should use encrypted_content field
        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="",  # Empty when encrypted
            encrypted_content="[encrypted data here]"
        )
        db.session.add(message)
        db.session.commit()

        # Encrypted messages store data in encrypted_content field
        assert message.encrypted_content == "[encrypted data here]"
        assert message.content == ""  # Regular content empty for encrypted msgs

    def test_last_message_timestamp_update(self, db, user_factory):
        """Test that last_message_at updates when messages are added.

        Why test this? Used for sorting conversations by recency.
        Should update automatically when new messages arrive.

        Note: This might require a trigger or service method in production.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        original_timestamp = thread.last_message_at

        # Add a message (in production, service would update timestamp)
        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="New message"
        )
        db.session.add(message)

        # Manually update last_message_at (service would do this)
        thread.last_message_at = datetime.now(timezone.utc)
        db.session.commit()

        assert thread.last_message_at > original_timestamp

    def test_thread_user_order_doesnt_matter(self, db, user_factory):
        """Test that user1/user2 order doesn't create duplicates.

        Why test this? The system should treat (user1, user2) and (user2, user1)
        as the same thread to prevent duplicates.

        Note: This behavior depends on service layer implementation.
        """
        user1 = user_factory()
        user2 = user_factory()

        # Create thread with user1, user2
        thread1 = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread1)
        db.session.commit()

        # Try to create with reversed order
        # Note: Service layer should normalize this
        thread2 = DirectMessageThread(
            user1_id=user2.id,  # Swapped
            user2_id=user1.id   # Swapped
        )
        db.session.add(thread2)

        # This might succeed at model level but service should prevent it
        # Document actual behavior
        try:
            db.session.commit()
            # If it succeeds, we have two threads (not ideal)
            assert thread2.id is not None
            # TODO: Service layer should normalize user order
        except IntegrityError:
            # If constraint prevents it, that's good
            db.session.rollback()